export const SITE = {
  origin: "https://polychromaticlithic.com",
  name: "Astarの素敵なホームページ V3",
  lang: "ja",
  locale: "ja_JP",
  /**
   * ヘッダーのアイコン。円形に抜かれるので、正方形で中央に寄せた絵が合う。
   * public/ に置いたファイルへのパスか、data URI。data URI なら
   * サブリソースが増えないので 1 ドキュメント = 1 リクエストのまま保てる。
   */
  avatar: "/avatar.svg",
  /** 1 ページあたりの転送量（Brotli, byte）の上限。超えたらビルドを落とす。 */
  budgetBrotli: 8 * 1024,
} as const;

export const NAV = [
  { href: "/", label: "Index" },
  { href: "/works/", label: "Works" },
  { href: "/blog/", label: "Blog" },
  { href: "/about/", label: "About" },
] as const;
