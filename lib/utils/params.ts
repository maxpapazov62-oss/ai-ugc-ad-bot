export function parseId(value: string | null | undefined): number | null {
  if (value == null) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
