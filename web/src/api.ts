// Usa VITE_API_URL só se for uma URL absoluta (http/https). Senão, força "/api".
const env = (import.meta.env.VITE_API_URL as string | undefined) || "";
const API = /^https?:\/\//.test(env) ? env : "/api";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}

export { http }; // e mantenha seus exports (getBalancete, getDre, etc.)

export type TipoConta = "ativo" | "passivo" | "patrimonio" | "receita" | "despesa";

export type BalanceteItem = {
  conta_id: number; codigo: string; nome: string; tipo: TipoConta;
  saldo_inicial: number; entrada_periodo: number; saida_periodo: number;
  variacao_periodo: number; saldo_final: number;
};

export type DreItem = { 
  codigo: string; nome: string; 
  tipo: "receita" | "despesa"; 
  valor: number };

export type DreResp = {
  intervalo: { de: string; ate: string };
  receitas: DreItem[]; despesas: DreItem[];
  totais: { total_receitas: number; total_despesas: number; resultado: number };
};

export type Conta = {
  id: number;
  codigo: string;
  nome: string;
  tipo: TipoConta
  ativa: boolean;
  conta_pai_id: number | null;
};

export async function getBalancete(params?: { de?: string; ate?: string; so?: boolean }) {
  const q = new URLSearchParams();
  if (params?.de) q.set("de", params.de);
  if (params?.ate) q.set("ate", params.ate);
  if (params?.so) q.set("so_com_movimento", "1");
  const qs = q.toString();
  return http<{ intervalo: any; itens: BalanceteItem[] }>(`/balancete${qs ? `?${qs}` : ""}`);
}

export async function getDre(de: string, ate: string) {
  const q = new URLSearchParams({ de, ate }).toString();
  return http<DreResp>(`/dre?${q}`);
}

export async function postLancamento(input: {
  data: string; historico?: string;
  linhas: { conta_id: number; debito?: number; credito?: number }[];
}) {
  return http<{ id: number }>(`/lancamentos`, { method: "POST", body: JSON.stringify(input) });
}

export async function getExtrato(params: {
  conta_id: number;
  de?: string;
  ate?: string;
  limit?: number;
  offset?: number;
}) {
  const q = new URLSearchParams();
  q.set("conta_id", String(params.conta_id));
  q.set("contaId", String(params.conta_id)); // compat: algumas APIs usam camelCase
  if (params.de) q.set("de", params.de);
  if (params.ate) q.set("ate", params.ate);
  if (params.limit) q.set("limit", String(params.limit));
  if (params.offset) q.set("offset", String(params.offset));
  return http<any>(`/extrato?${q.toString()}`);
}

export function getContas() {
  return http<Conta[]>("/contas");
}

export function createConta(input: { codigo: string; nome: string; tipo: Conta["tipo"]; conta_pai_id?: number | null }) {
  return http<{ id: number }>("/contas", { method: "POST", body: JSON.stringify(input) });
}

export function updateConta(id: number, input: { codigo: string; nome: string; tipo: Conta["tipo"]; ativa: boolean; conta_pai_id?: number | null }) {
  return http<{ ok: true }>(`/contas/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function toggleConta(id: number, ativa: boolean) {
  return http<{ ok: true }>(`/contas/${id}/ativar`, { method: "PATCH", body: JSON.stringify({ ativa }) });
}

export function deleteConta(id: number) {
  return http<{ ok: true }>(`/contas/${id}`, { method: "DELETE" });
}


