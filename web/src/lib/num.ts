export function num(x: unknown, fallback = 0): number {
  if (x === null || x === undefined) return fallback;
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

export function money(x: unknown, currency = "BRL"): string {
  return num(x).toLocaleString("pt-BR", { style: "currency", currency });
}
// Converte um valor numérico em string formatada com 2 casas decimais
export function formatMoney(value: number | string): string {
  const n = typeof value === "number" ? value : Number(value.replace(",", "."));
  if (isNaN(n)) return "0,00";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Converte a string do input em número puro (float)
export function parseMoney(str: string): number {
  const clean = str.replace(/[^\d,.-]/g, "").replace(",", ".");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
