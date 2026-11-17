/**
 * タグ名を URL の 1 段に置ける形にする。
 *
 * タグ名は frontmatter に書いたままの文字なので、`C#` や空白を含むことがある。
 * `#` や `/` はエンコードしても安全に運べない（出力先のフォルダ名と、
 * サーバーが解釈するパスが食い違う）ので、読める別の文字に置き換える。
 *
 *   C#  → C-sharp      C++ → C-plus-plus      Unity 6 → Unity-6
 *
 * 日本語のタグはそのまま通る（リンクにするときに `tagHref` がエンコードする）。
 */
export const tagSlug = (tag: string): string =>
  tag
    .trim()
    .replaceAll('#', '-sharp')
    .replaceAll('+', '-plus')
    .replace(/[\s/\\?%&]+/g, '-');

/** タグの一覧ページへのパス。リンクは必ずここを通して作る。 */
export const tagHref = (tag: string): string => `/tags/${encodeURIComponent(tagSlug(tag))}/`;
