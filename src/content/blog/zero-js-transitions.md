---
title: JavaScript なしでページ遷移をなめらかにする
summary: View Transitions と Speculation Rules を CSS と宣言だけで使い、遷移を SPA 並みにした。
published: 2026-06-02
tags: [css, web, perf]
---

「ページ遷移が気持ちいいサイト」を作るために SPA にする必要はもうない。
必要なものは 2 つあって、どちらもクライアント JavaScript を要求しない。

## 1. クロスドキュメント View Transitions

CSS に 3 行書くだけで、ページ間の遷移がクロスフェードになる。

```css
@view-transition {
  navigation: auto;
}
```

要素をまたいでモーフィングさせたいときは、遷移元と遷移先で同じ
`view-transition-name` を付ける。このサイトではヘッダーに付けてある。

```css
.masthead {
  view-transition-name: masthead;
}
```

フレームワークのルータ（Astro の `<ClientRouter />` など）は同じ体験を
未対応ブラウザにも届けてくれるが、10 KB 前後の JavaScript が乗る。
未対応ブラウザでは「ただの普通の遷移」に戻るだけなので、ここは素の CSS を選んだ。

## 2. Speculation Rules

遷移を速くする本命はこちら。次に開きそうなページを、ブラウザに先読みさせる。

```html
<script type="speculationrules">
  {
    "prerender": [{ "where": { "href_matches": "/*" }, "eagerness": "moderate" }]
  }
</script>
```

`type="speculationrules"` の `<script>` は JavaScript として実行されない。
ブラウザに渡す JSON の設定であって、コードではない。CSP の `script-src` にも引っかからない。

`eagerness` は先読みの積極性で、`moderate` はリンクに 200 ms ほどホバーしたら開始する。
`immediate` はビューポートに入った時点で全部取りに行くので、リンクの多いページでは
帯域の無駄になりやすい。

## 効き方

この 2 つを入れると、2 ページ目以降の遷移がほぼゼロになる。ホバーした時点で
プリレンダリングが済んでいるので、クリック時にネットワークを待たない。

しかも `prerender` はドキュメント全体を隠しタブでレンダリング済みにするため、
CSS のパースもレイアウトも終わっている。SPA のルーティングが JavaScript で
やっていたことを、ブラウザ本体がやっている。

> 未対応ブラウザ（現状 Safari と Firefox）では、どちらの機能も単に何も起きない。
> 遷移は普通に速いままで、壊れるところがない。これがプログレッシブエンハンスメントの
> 一番気持ちのいい形だと思う。
