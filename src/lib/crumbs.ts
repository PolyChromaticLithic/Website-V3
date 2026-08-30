/**
 * ヘッダーの現在地表示（パンくず）を URL から組み立てる。
 *
 * ページ側が何も渡さなくても URL だけで道が出るようにしてある。記事名のように
 * slug から作った文字では足りないときだけ、レイアウトの `crumb` で末尾を差し替える。
 */

export interface Crumb {
  /** 表示する文字。 */
  label: string;
  /** 行き先。一覧ページを持たない段は null にして、ただの文字として置く。 */
  href: string | null;
}

/**
 * 第 1 段の表記。ここに無いパスは slug から作った文字で出る。
 *
 * `index: false` は「その階層に一覧ページが無い」印。そこをリンクにすると
 * 自分で 404 へ送ることになるので、ただの文字として置く。
 */
const SECTIONS: Record<string, { label: string; index: boolean }> = {
  works: { label: 'Works', index: true },
  blog: { label: 'Blog', index: true },
  about: { label: 'About', index: true },
  tags: { label: 'Tags', index: true },
  sitemap: { label: 'Sitemap', index: true },
};

/** byte-budget → Byte Budget。slug を生で出すとその段だけ書体が崩れる。 */
const titleize = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/**
 * 行き先の分からないページで出す 1 段。
 *
 * 404 は「見つからなかった URL」ごとに配られる 1 枚の静的ページなので、
 * ビルド時にはどのパスで読まれるか分からない。辿れない道は伏せる。
 */
export const UNKNOWN_TRAIL: Crumb[] = [{ label: '??', href: null }];

/**
 * @param pathname 現在の URL のパス。前後のスラッシュはあってもなくてもよい。
 * @param leaf 末尾の段に出したい文字。省くと slug から作る。
 */
export function crumbsFor(pathname: string, leaf?: string | undefined): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);

  return segments.map((segment, i) => {
    const last = i === segments.length - 1;
    // 第 1 段だけが「一覧ページを持つか」を知っている。2 段目から下は
    // そのままのパスに繋ぐ（今のところ /blog/<記事> と /tags/<タグ> だけ）。
    const section = i === 0 ? SECTIONS[segment] : undefined;

    return {
      label: (last && leaf) || section?.label || titleize(segment),
      href: section && !section.index ? null : `/${segments.slice(0, i + 1).join('/')}/`,
    };
  });
}
