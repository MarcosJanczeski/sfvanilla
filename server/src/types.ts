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
