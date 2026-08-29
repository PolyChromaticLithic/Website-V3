# Website V3 — Console × Depth

個人サイト。JavaScript を 1 バイトも配信せず、Web フォントも読み込まない静的サイト。
Astro でビルドして Cloudflare Pages から配信する。

デザインは Console 案（計器盤）の版面を骨格に、Depth 案（深度）の余白・光・
角丸のヘッダーを合わせた最終案。区画の塗りを落として下の背景を通し、
盤面の方眼はページの 2 倍速で流れる。詳しくは末尾の「デザイン」を見る。

```
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # 型チェック → ビルド → 転送量の計測と刻印
pnpm preview   # dist/ をローカルで配信
pnpm check     # astro check + biome ci
pnpm fix       # biome で整形・自動修正
```

## 設計の前提

| 項目 | 決めたこと |
| --- | --- |
| クライアント JS | 0 バイト。UI フレームワークもルータも入れない |
| Web フォント | 使わない。日本語は OS のシステムフォントで組む |
| CSS | HTML に完全インライン化（`build.inlineStylesheets: 'always'`）。CSS の読み込みは 0 |
| サブリソース | ヘッダーのアイコン 1 枚だけ。data URI にすれば 1 ページ = 1 リクエストに戻る |
| ページ遷移 | CSS の `@view-transition` と Speculation Rules。どちらも実行 JS なし |
| ダークモード | `prefers-color-scheme` のみ。トグルを付けると JS が必要になるので付けない |
| ナビゲーション | `details` / `summary` の開閉だけ。狭い画面ではハンバーガーになる |
| 背景の装飾 | CSS スクロール駆動アニメーション（`animation-timeline`）。コンポジタで動く |
| 転送量 | 1 ページ 8 KiB（Brotli）以内。超えたらビルドが失敗する |

## 転送量の予算

`src/config.ts` の `budgetBrotli` が上限。ビルドの最後に `scripts/stamp-metrics.mjs` が
`dist/` の全 HTML を Brotli で実測し、超えていたら exit 1 する。

同じスクリプトが、計測した値をページ自身に刻む。`src/components/SpecStrip.astro` の
`@@@TRSF@@@` などのプレースホルダが実測値に置換される。トークンは 10 文字固定で
同じ長さの文字列に置き換わるため、表示される「非圧縮バイト数」は出力ファイルの
サイズと完全に一致する。Brotli 側は自己参照になるので不動点を探している。

不動点は素朴な反復だけだと 2 周期に落ちることがある。そこで「10 文字に詰めるときの
詰め方」——前詰めか後詰めか、余りを空白・タブ・改行のどれで埋めるか——を回して写像を
ずらし、厳密に一致する組み合わせを探している。HTML では連続する空白類が 1 個に畳まれる
ので、どれを選んでも表示は 1 ピクセルも変わらない
（詳細はスクリプト内のコメントと `src/content/blog/byte-budget.md`）。

読み取り値はフッターの数字 3 つだけ。ゲージやバーは置かない。

## 記事を書く（Obsidian）

記事は `src/content/blog/*.md`。Obsidian の Vault をこのリポジトリに向けると、
GUI で書いてそのまま `git push` できる。

**Obsidian 側の設定**（Settings → Files and links）

- Default location for new attachments … `In subfolder under current folder`
- Subfolder name … `_assets`（`_` で始まるフォルダは Astro が無視する）
- Use `[[Wikilinks]]` … **オフ**（標準の Markdown リンクにする）
- New link format … `Relative path to file`

添付画像を `![](./_assets/foo.png)` の形で参照すると、Astro がビルド時に
WebP / AVIF へ変換してサイズ属性も付ける。

**frontmatter**（`src/content.config.ts` の zod スキーマで検証される。壊れるとビルドが落ちる）

```yaml
---
title: 記事のタイトル
summary: 一覧と OGP に出る 1〜2 文の要約
published: 2026-08-27
updated: 2026-08-28   # 任意
tags: [perf, css]
draft: false          # true の間は公開されない
---
```

ファイル名がそのまま URL になる（`byte-budget.md` → `/blog/byte-budget/`）。

## 作品を追加する

`src/content/works/*.md`。スキーマは `title` / `summary` / `year` / `role` /
`stack` / `url` / `repo` / `order`。`order` の小さい順に並ぶ。

## デプロイ（Cloudflare Pages）

1. GitHub にリポジトリを作って push する
2. Cloudflare ダッシュボード → Workers & Pages → Create → Pages → Git 連携
3. ビルド設定
   - Framework preset … `Astro`
   - Build command … `pnpm build`
   - Build output directory … `dist`
   - Node のバージョンは `.node-version`（24）が読まれる
4. 独自ドメインを Custom domains から接続する

`public/_headers` がキャッシュとセキュリティヘッダを指定する。ハッシュ付きアセットは
1 年 immutable、HTML は毎回検証。

## 公開前に差し替えるもの

- `src/config.ts` … `origin` / `name` / `tagline`
- `public/robots.txt` … Sitemap の URL
- `src/pages/about.astro`、`src/pages/index.astro` … 本文とメールアドレス
- `src/content/works/sample-tool.md` … サンプルなので削除するか書き換える

## ディレクトリ

```
src/
  config.ts            サイト全体の設定と予算
  content.config.ts    コレクションのスキーマ
  content/
    blog/              記事（Obsidian の Vault をここに向ける）
    works/             作品
  components/
    SpecStrip.astro    実測値の読み取り（右端に縦、狭い画面ではフッター）
    SiteHeader.astro   浮いたラック。details でハンバーガーになる
    SiteFooter.astro
    PostRow.astro      公開日と、あれば更新日
  layouts/Base.astro   <head> の一元管理
  lib/
    date.ts
    rehype-table-scroll.ts  表を横スクロールする箱で包む
  pages/               ルーティング
  styles/app.css       @layer で構成した単一のスタイルシート
scripts/
  stamp-metrics.mjs    転送量の計測・刻印・予算チェック
public/
  _headers             Cloudflare のヘッダ設定
```

## デザイン — Console × Depth

方眼の盤面に区画を並べる Console の版面へ、Depth の静けさを通した合流案。
書いたものも作ったものも、区画に収めた読み取り値として置く。

- **パレット** … Iceberg 由来。盤面はほぼ黒（`#0d0f19`）、表示はブルーグレー、
  シアンは「いま見ている場所」と「値」にだけ使う。ライトも同じ役割分担のまま反転させる。
  本文・淡色文字・アクセントとも、明暗どちらでも 4.5:1 以上を確保している。
- **背景** … 下から方眼／覆い／光の 3 枚。方眼はページの 2 倍の速さで上へ流れる。
  面を本文の 2 倍の高さに取り、スクロール可能距離ぶんだけ余分に引き上げると、
  面が文書と一緒に動く 1 倍と足してちょうど 2 倍速になる（`grid-fall`）。
  方眼は 45° に倒してある。水平線は縦に動かしても動いて見えないが、斜めなら
  縦の移動が横滑りとして出るので、ページとの速度差がそこで初めて読める。
  覆いは地色そのもので、上下の両端から伏せて方眼を中ほどの帯にだけ残す。
  上を空けたままだとヘッダーの真下で線が途切れて見える。`mask` と違って画面に固定でき、
  下の面がどれだけ流れても縁は動かない。光は上端から差す 1 枚と、大きさも間隔も
  揃えない藍のにじみ 6 つ。重なった縁が互いを打ち消すので輪郭のないむらになる。
  すべて `animation-timeline: scroll(root)`、JS は 0 バイト。
- **区画** … 対角の 2 隅にだけ切り欠きを入れた枠。塗りは持たせず、下の方眼と光を通す。
  角括弧のラベルは CSS の `content` で足しているので、HTML には素のテキストしか入らない。
- **ヘッダー** … 上に浮く角丸のラック。最上部では枠も塗りも持たず、
  180px 降りたところで硝子の板になる。動きを止めた環境では最初から板で出る。
  硝子が成立する条件はふたつある。ひとつは塗りの薄さで、地色の 68%。
  9 割まで上げると `backdrop-filter` は掛かっていても下が透けない。
  もうひとつは `view-transition-name` の位置。これを持つ要素は backdrop root に
  なるので、外側の `.rack` に付けると中の `backdrop-filter` は自分の内側しか
  写さない。名前は板そのもの（`.rack__bar`）に付ける。
  現在地は塗りと内枠で示し、44rem 未満では `details` のハンバーガーに畳まれる。
- **アイコン** … 名前の左に円形（`border-radius: 50%` + `object-fit: cover`）。
  差し替えは `src/config.ts` の `SITE.avatar` 1 か所。正方形で中央に寄せた絵が合う。
  `public/avatar.svg` は差し替え前提の仮置き。実体は下の「アイコン」を見る。
- **読み取り値** … 78rem 以上では右の余白に縦組みで垂らし、
  それ未満ではフッターの刻印に戻る。出るのはどちらか一方だけ。
- **一覧** … 日付・本文・タグの 3 列。hover と focus で余白を変えないので、
  行の位置は動かない。タグの列には上限があり、長いタグが来ても本文が痩せない。

### アイコン

`SITE.avatar` が指す先を替えるだけで入れ替わる。`public/` にファイルを置く方法と、
data URI を直接書く方法の 2 つがある。

```
public/avatar.webp を置いて  avatar: '/avatar.webp'   … 読み込みが 1 つ増える（request 2）
data URI を直接書く          avatar: 'data:image/webp;base64,...'  … request 1 のまま
```

data URI は base64 のぶん約 4/3 に膨らみ、Brotli も効きにくい。転送量の予算
（1 ページ 8 KiB）に載せるので、64〜96 px 角の WebP まで小さくしてから埋める。
超えればビルドが落ちるので、踏み外しても気づける。

### 確認したこと

390 / 768 / 1280 px（および 320 / 1024 / 1920 px）で全ページに横溢れなし。
方眼の移動量は実測で確認した（進捗 50% でスクロール量と同じだけ余分に動く = 2 倍速）。
硝子のヘッダーは、下に本文を潜らせた状態で明暗の両方を目視確認している。
ダークとライトの両方でコントラスト比を実測。フォーカスで版面が動かないこと、
空データ・長文・広い表・404 の各表示、コンソールエラーが 0 件であることを確認済み。
