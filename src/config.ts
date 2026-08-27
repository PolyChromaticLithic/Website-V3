export const SITE = {
  origin: 'https://example.com',
  name: 'Polychromatic',
  tagline: 'ソフトウェアを書きます。速いものが好きです。',
  lang: 'ja',
  locale: 'ja_JP',
  /** 1 ページあたりの転送量（Brotli, byte）の上限。超えたらビルドを落とす。 */
  budgetBrotli: 8 * 1024,
} as const;

export const NAV = [
  { href: '/', label: 'Index' },
  { href: '/works/', label: 'Works' },
  { href: '/blog/', label: 'Blog' },
  { href: '/about/', label: 'About' },
] as const;
