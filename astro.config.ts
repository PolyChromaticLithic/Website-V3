import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { SITE } from './src/config';

export default defineConfig({
  site: SITE.origin,
  // CSS を HTML に完全インライン化する。1 ドキュメント = 1 リクエストにするための要。
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
  integrations: [sitemap()],
  markdown: {
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
