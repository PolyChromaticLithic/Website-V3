import { readdirSync, readFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { SITE } from './src/config';
import { rehypeTableScroll } from './src/lib/rehype-table-scroll';

/**
 * 記事の URL → 最終更新日。XML サイトマップの lastmod に使う。
 *
 * 設定ファイルの中ではコンテンツコレクションを読めないので、frontmatter の
 * `updated`（無ければ `published`）だけを直接拾う。日付の書式が崩れている
 * 記事は拾わずに飛ばす（検証はコレクションのスキーマ側の仕事）。
 */
function blogLastmod(): Map<string, string> {
  const dir = new URL('./src/content/blog/', import.meta.url);
  const dates = new Map<string, string>();
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.md') || name.startsWith('_')) continue;
    const frontmatter = readFileSync(new URL(name, dir), 'utf8').match(
      /^---\r?\n([\s\S]*?)\r?\n---/,
    );
    if (!frontmatter?.[1]) continue;
    const field = (key: string) =>
      frontmatter[1]?.match(new RegExp(`^${key}:\\s*["']?([^"'\\s#]+)`, 'm'))?.[1];
    const date = new Date(field('updated') ?? field('published') ?? '');
    if (Number.isNaN(date.getTime())) continue;
    dates.set(`${SITE.origin}/blog/${name.slice(0, -3)}/`, date.toISOString());
  }
  return dates;
}

const lastmod = blogLastmod();

export default defineConfig({
  site: SITE.origin,
  // CSS を HTML に完全インライン化する。1 ドキュメント = 1 リクエストにするための要。
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
  integrations: [
    sitemap({
      // 記事にだけ lastmod を付ける。一覧やタグのページは更新日を持たない。
      serialize(item) {
        const date = lastmod.get(item.url);
        return date ? { ...item, lastmod: date } : item;
      },
    }),
  ],
  markdown: {
    // 表だけは横に伸びうるので、スクロールできる箱に入れてから配る。
    rehypePlugins: [rehypeTableScroll],
    // Shiki はビルド時に色付き HTML を吐くのでランタイムコストは 0。
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-default' },
      wrap: true,
    },
  },
  vite: {
    build: {
      // 出力を 1 枚のスタイルシートにまとめてからインライン化させる。
      cssCodeSplit: false,
    },
  },
});
