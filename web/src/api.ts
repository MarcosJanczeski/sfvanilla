// const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// async function http<T>(path: string, init?: RequestInit): Promise<T> {
//   const r = await fetch(`${API}${path}`, {
//     headers: { "content-type": "application/json", ...(init?.headers || {}) },
//     ...init,
//   });
//   if (!r.ok) throw new Error(await r.text());
//   return r.json() as Promise<T>;
// }
// Tenta usar env; se não houver, usa "/api" (passa pelo proxy do Vite)
const API = (import.meta.env.VITE_API_URL as string | undefined) || "/api";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}


export type TipoConta = "ativo" | "passivo" | "patrimonio" | "receita" | "despesa";

export type BalanceteItem = {
  conta_id: number; codigo: string; nome: string; tipo: TipoConta;
  saldo_inicial: number; entrada_periodo: number; saida_periodo: number;
  variacao_periodo: number; saldo_final: number;
};

export type BalanceteResp = {
  intervalo: { de: string | null; ate: string | null };
  itens: BalanceteItem[];
};

export type DreItem = { codigo: string; nome: string; tipo: "receita" | "despesa"; valor: number };
export type DreResp = {
  intervalo: { de: string; ate: string };
  receitas: DreItem[]; despesas: DreItem[];
  totais: { total_receitas: number; total_despesas: number; resultado: number };
};

export type Conta = { id: number; codigo: string; nome: string; tipo: TipoConta; ativa: boolean };

export async function getBalancete(params?: { de?: string; ate?: string; so?: boolean }) {
  const q = new URLSearchParams();
  if (params?.de) q.set("de", params.de);
  if (params?.ate) q.set("ate", params.ate);
  if (params?.so) q.set("so_com_movimento", "1");
  const qs = q.toString();
  return http<BalanceteResp>(`/balancete${qs ? `?${qs}` : ""}`);
}

export async function getDre(de: string, ate: string) {
  const q = new URLSearchParams({ de, ate }).toString();
  return http<DreResp>(`/dre?${q}`);
}

export async function getContas() {
  return http<Conta[]>(`/contas`);
}

export async function postLancamento(input: {
  data: string; historico?: string;
  linhas: { conta_id: number; debito?: number; credito?: number }[];
}) {
  return http<{ id: number }>(`/lancamentos`, { method: "POST", body: JSON.stringify(input) });
}