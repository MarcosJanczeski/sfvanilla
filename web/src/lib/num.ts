export function num(x: unknown, fallback = 0): number {
  if (x === null || x === undefined) return fallback;
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

export function money(x: unknown, currency = "BRL"): string {
  return num(x).toLocaleString("pt-BR", { style: "currency", currency });
}
