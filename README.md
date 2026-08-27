# Website V3

個人サイト。JavaScript を 1 バイトも配信せず、Web フォントも読み込まない静的サイト。
Astro でビルドして Cloudflare Pages から配信する。

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
| CSS | HTML に完全インライン化（`build.inlineStylesheets: 'always'`）。1 ページ = 1 リクエスト |
| ページ遷移 | CSS の `@view-transition` と Speculation Rules。どちらも実行 JS なし |
| ダークモード | `prefers-color-scheme` のみ。トグルを付けると JS が必要になるので付けない |
| 転送量 | 1 ページ 8 KiB（Brotli）以内。超えたらビルドが失敗する |

## 転送量の予算

`src/config.ts` の `budgetBrotli` が上限。ビルドの最後に `scripts/stamp-metrics.mjs` が
`dist/` の全 HTML を Brotli で実測し、超えていたら exit 1 する。

同じスクリプトが、計測した値をページ自身に刻む。`src/components/SpecStrip.astro` の
`@@@TRSF@@@` などのプレースホルダが実測値に置換される。トークンは 10 文字固定で
同じ長さの文字列に置き換わるため、表示される「非圧縮バイト数」は出力ファイルの
サイズと完全に一致する。Brotli 側は自己参照になるので不動点を探している
（詳細はスクリプト内のコメントと `src/content/blog/byte-budget.md`）。

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
    SpecStrip.astro    実測値の表示（このサイトの核）
    SiteHeader.astro
    SiteFooter.astro
    PostRow.astro
  layouts/Base.astro   <head> の一元管理
  pages/               ルーティング
  styles/app.css       @layer で構成した単一のスタイルシート
scripts/
  stamp-metrics.mjs    転送量の計測・刻印・予算チェック
public/
  _headers             Cloudflare のヘッダ設定
```
