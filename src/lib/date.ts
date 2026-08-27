/** 2026.08.27 のような、等幅で桁が揃う表記にする。 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

/** <time datetime> 用。 */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
