---
title: このサイト（Website V3）
summary: JavaScript とフォントを 1 バイトも送らない個人サイト。ページごとの転送量をビルド時に実測し、予算を超えたらビルドを落とす。
year: 2026
role: 設計 / 実装 / デザイン
stack: [Astro, TypeScript, CSS, Cloudflare Pages]
repo: https://github.com/
order: 1
---

3 度目の作り直し。前の 2 つは凝りすぎて更新が止まったので、今回は「速さ」だけを制約にして
そこから逆算した。

- クライアント JavaScript **0 バイト**、Web フォント **0 バイト**
- CSS は HTML に完全インライン化。ドキュメント 1 リクエストで表示が完了する
- ページ遷移は View Transitions と Speculation Rules（どちらも実行 JS なし）
- 記事は Obsidian で書いて `git push`。Cloudflare Pages が自動でビルドする

一番効いたのは、gzip 後のサイズに予算を設けてビルドを失敗させるようにしたこと。
「軽く保つ」が意思ではなく仕組みになった。
