export type TipoConta = "ativo" | "passivo" | "patrimonio" | "receita" | "despesa";

export type Conta = {
  id: number;
  codigo: string;
  nome: string;
  tipo: TipoConta;
  ativa: boolean;
  conta_pai_id: number | null;
};

export type LinhaLancamento = {
  conta_id: number;
  debito?: number;
  credito?: number;
};

export type LancamentoInput = {
  data: string;            // YYYY-MM-DD
  historico?: string | null;
  linhas: LinhaLancamento[];
};

export type ExtratoItem = {
  movimento_id: number;
  lancamento_id: number;
  data: string;
  historico: string;
  entrada: number;
  saida: number;
  saldo: number;
};

export type BalanceteItem = {
  conta_id: number;
  codigo: string;
  nome: string;
  tipo: TipoConta;
  saldo_inicial: number;      // até (de - 1)
  entrada_periodo: number;    // no período
  saida_periodo: number;      // no período
  variacao_periodo: number;   // impacto no saldo (normalizado por tipo)
  saldo_final: number;        // saldo_inicial + variacao_periodo
};

export type DreItem = {
  codigo: string;
  nome: string;
  tipo: "receita" | "despesa";
  valor: number;              // normalizado (receita = cred - deb; despesa = deb - cred)
};
