/**
 * ビルド後に dist/ の HTML を実測し、SpecStrip のプレースホルダを実際の数値に差し替える。
 *
 * 仕掛け：プレースホルダは 10 文字固定で、同じ長さの文字列に置換される。
 * よって「非圧縮バイト数」は置換後のファイルサイズと 1 バイトも違わない。
 * Brotli 後のサイズだけは中身が変わると揺れるので、値が安定するまで
 * 置換を繰り返して不動点を取る（通常 1〜2 回で収束する）。
 *
 * 圧縮は Cloudflare が配信時に行うものと同じ Brotli。品質 11 は
 * 静的アセットに対して Cloudflare が使う水準に合わせている。
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';

const DIST = resolve('dist');
const TOKEN_WIDTH = 10;
const TOKENS = {
  transfer: '@@@TRSF@@@',
  raw: '@@@RAWB@@@',
  ratio: '@@@RATO@@@',
  requests: '@@@REQS@@@',
};

const budget = await loadBudget();

async function loadBudget() {
  try {
    // Node 22.18+ / 24 は .ts をそのまま読める（型注釈を落とすだけ）。
    const mod = await import(pathToFileURL(resolve('src/config.ts')).href);
    return mod.SITE.budgetBrotli;
  } catch {
    return 8 * 1024;
  }
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

const pad = (value) => {
  const text = String(value);
  if (text.length > TOKEN_WIDTH) throw new Error(`計測値がトークン幅を超えました: ${text}`);
  return text.padEnd(TOKEN_WIDTH, ' ');
};

const transferBytes = (html) =>
  brotliCompressSync(Buffer.from(html, 'utf8'), {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;

/** ドキュメント本体 + 外部サブリソースの数。CSS はインライン化済みなので数に入らない。 */
function countRequests(html) {
  const patterns = [
    /<img\b[^>]*\ssrc=/gi,
    /<source\b[^>]*\ssrcset=/gi,
    /<script\b[^>]*\ssrc=/gi,
    /<link\b[^>]*\srel=["']?(?:stylesheet|preload|modulepreload)/gi,
  ];
  return 1 + patterns.reduce((sum, re) => sum + (html.match(re)?.length ?? 0), 0);
}

function substitute(html, { transfer, raw, ratio, requests }) {
  return html
    .replaceAll(TOKENS.transfer, pad(transfer.toLocaleString('en-US')))
    .replaceAll(TOKENS.raw, pad(raw.toLocaleString('en-US')))
    .replaceAll(TOKENS.ratio, pad(ratio))
    .replaceAll(TOKENS.requests, pad(requests.toLocaleString('en-US')));
}

const report = [];
let over = 0;

for await (const file of walk(DIST)) {
  const source = await readFile(file, 'utf8');
  if (!source.includes(TOKENS.transfer)) continue;

  const raw = Buffer.byteLength(source, 'utf8');
  const requests = countRequests(source);

  // 数字を埋めると中身が変わり、Brotli のサイズも変わる。自己参照なので不動点 f(v) = v を探す。
  //
  // 反復だけでは 2 周期に落ちて不動点を跨いでしまうことがある。そこで
  // メーターの小数桁数という「表示に影響しない自由度」を回して写像を少しずつずらし、
  // 厳密に一致する組み合わせを探す。桁数が変わってもバーの見た目は変わらない。
  const search = () => {
    let best = null;

    for (const digits of [4, 3, 2, 5]) {
      const cache = new Map();
      const render = (transfer) =>
        substitute(source, {
          transfer,
          raw,
          requests,
          ratio: Math.min(transfer / budget, 1).toFixed(digits),
        });
      const probe = (value) => {
        if (!cache.has(value)) cache.set(value, transferBytes(render(value)));
        return cache.get(value);
      };

      // 素朴な反復。多くはここで一致する。
      let value = transferBytes(source);
      for (let i = 0; i < 16; i += 1) {
        const next = probe(value);
        if (next === value) break;
        if (cache.has(next)) break; // 循環に入った
        value = next;
      }

      // 循環したら候補の近傍を総当たり。
      if (probe(value) !== value) {
        const seen = [...cache.keys()];
        for (let v = Math.min(...seen) - 4; v <= Math.max(...seen) + 4; v += 1) {
          if (probe(v) === v) {
            value = v;
            break;
          }
        }
      }

      const error = Math.abs(probe(value) - value);
      if (best === null || error < best.error) best = { transfer: value, error, render };
      if (error === 0) break;
    }

    return best;
  };

  const { transfer, error, render } = search();
  const output = render(transfer);
  await writeFile(file, output, 'utf8');

  const path = `/${relative(DIST, file).replaceAll('\\', '/')}`;
  report.push({ path, transfer, raw, requests, error });
  if (transfer > budget) over += 1;
}

report.sort((a, b) => b.transfer - a.transfer);

const num = (n) => n.toLocaleString('en-US').padStart(7);
const rule = `  ${'─'.repeat(72)}`;

console.log(`\n  page weight  ·  budget ${budget.toLocaleString('en-US')} B brotli`);
console.log(rule);
for (const row of report) {
  const bar = '█'.repeat(Math.max(1, Math.round((row.transfer / budget) * 22))).slice(0, 22);
  const flag = row.transfer > budget ? '  OVER' : row.error === 0 ? '' : `  ±${row.error}`;
  console.log(
    `  ${num(row.transfer)} B  ${bar.padEnd(22)}  ${num(row.raw)} B raw  req ${row.requests}  ${row.path}${flag}`,
  );
}
console.log(rule);
console.log(`  ${report.length} ページを計測しました。\n`);

if (over > 0) {
  console.error(`  ${over} ページが予算 ${budget.toLocaleString('en-US')} B を超えています。\n`);
  process.exit(1);
}
