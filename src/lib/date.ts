/**
 * 2026.08.27 のような、等幅で桁が揃う表記にする。
 *
 * frontmatter の `2026-08-27` は UTC の 0 時として読まれる。ローカル時刻で
 * 取り出すと、UTC より西でビルドしたとき前日にずれるので、UTC のまま読む。
 */
export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

/** <time datetime> 用。 */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
