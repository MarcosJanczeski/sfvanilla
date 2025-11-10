import { useEffect, useMemo, useState } from "react";
import { getContas, getExtrato } from "../api";
import type { Conta } from "../api";
import { money } from "../lib/num"; // se não existir, crie lib/num.ts ou troque por fmt local

type ExtratoItem = {
  movimento_id: number;
  lancamento_id: number;
  data: string;     // YYYY-MM-DD
  historico: string;
  entrada: number | null;
  saida: number | null;
  saldo: number | null; // saldo corrido vindo da API
};

type ExtratoResp = {
  conta: Pick<Conta, "id" | "codigo" | "nome" | "tipo">;
  intervalo: { de: string | null; ate: string | null };
  itens: ExtratoItem[];
  paginacao: { limit: number; offset: number };
};

const hoje = new Date();
const yyyy = hoje.getFullYear();
const mm = String(hoje.getMonth() + 1).padStart(2, "0");
const dePadrao = `${yyyy}-${mm}-01`;
const atePadrao = `${yyyy}-${mm}-${new Date(yyyy, hoje.getMonth() + 1, 0)
  .getDate()
  .toString()
  .padStart(2, "0")}`;

// fallback simples se não quiser usar ../lib/num
// const money = (x: unknown, currency = "BRL") =>
//   (Number(x ?? 0)).toLocaleString("pt-BR", { style: "currency", currency });

function groupByDate(items: ExtratoItem[]) {
  const map = new Map<string, ExtratoItem[]>();
  for (const it of items) {
    const arr = map.get(it.data) ?? [];
    arr.push(it);
    map.set(it.data, arr);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

export default function Extrato() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [contaId, setContaId] = useState<number | "">(""); // 👈 nunca null
  const [de, setDe] = useState(dePadrao);
  const [ate, setAte] = useState(atePadrao);
  const [dados, setDados] = useState<ExtratoResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  async function carregar(opts?: { reset?: boolean }) {
    if (!contaId) return;
    const nextOffset = opts?.reset ? 0 : offset;

    setLoading(true);
    setErro(null);
    try {
      const resp = await getExtrato({
        conta_id: Number(contaId),
        de,
        ate,
        limit,
        offset: nextOffset,
      });
      setDados(resp);
      if (opts?.reset) setOffset(0);
    } catch (e: any) {
      setErro(e?.message || "Falha ao carregar extrato");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const c = await getContas();
      setContas(c);
      const firstId = c[0]?.id;
      if (firstId) {
        setContaId(firstId);
        setOffset(0);
        setTimeout(() => carregar({ reset: true }), 0);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // recarrega quando de/ate/limit mudam
  useEffect(() => {
    if (contaId) carregar({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [de, ate, limit]);

  const grupos = useMemo(() => groupByDate(dados?.itens || []), [dados]);

  return (
    <section className="card">
      <h2 style={{ marginBottom: 12 }}>Extrato</h2>

      <div className="fields" style={{ marginBottom: 12 }}>
        <div className="field">
          <div className="muted">Conta</div>
          <select
            value={contaId}
            onChange={(e) => {
              const id = Number(e.target.value);
              if (Number.isFinite(id) && id > 0) {
                setContaId(id);
                setOffset(0);
                setTimeout(() => carregar({ reset: true }), 0);
              }
            }}
          >
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} — {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div
          className="fields"
          style={{ gridTemplateColumns: "1fr 1fr", display: "grid" }}
        >
          <div className="field">
            <div className="muted">De</div>
            <input
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
            />
          </div>
          <div className="field">
            <div className="muted">Até</div>
            <input
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
            />
          </div>
        </div>

        <div
          className="fields"
          style={{ gridTemplateColumns: "1fr 1fr", display: "grid" }}
        >
          <div className="field">
            <div className="muted">Itens por página</div>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
          <div className="field">
            <div className="muted">Ações</div>
            <div className="row" style={{ gap: 8 }}>
              <button type="button" onClick={() => carregar({ reset: true })}>
                Atualizar
              </button>
              <button
                type="button"
                onClick={() => {
                  setOffset((o) => Math.max(0, o - limit));
                  setTimeout(() => carregar(), 0);
                }}
                disabled={offset === 0}
                className="secondary"
              >
                ◀︎ Anterior
              </button>
              <button
                type="button"
                onClick={() => {
                  setOffset((o) => o + limit);
                  setTimeout(() => carregar(), 0);
                }}
                disabled={(dados?.itens?.length || 0) < limit}
                className="secondary"
              >
                Próxima ▶︎
              </button>
            </div>
          </div>
        </div>
      </div>

      {erro && <div className="notice" style={{ marginBottom: 12 }}>{erro}</div>}
      {loading && <div className="card">Carregando…</div>}

      {!loading && dados && (
        <>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="muted">Conta</div>
                <b>
                  {dados.conta.codigo} — {dados.conta.nome}
                </b>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="muted">Período</div>
                <b>
                  {(de || "início")} — {(ate || "hoje")}
                </b>
              </div>
            </div>
          </div>

          <div className="fields">
            {grupos.map(([data, arr]) => (
              <div key={data} className="card">
                <div
                  className="row"
                  style={{ justifyContent: "space-between", marginBottom: 8 }}
                >
                  <div className="badge">
                    {new Date(data).toLocaleDateString("pt-BR")}
                  </div>
                </div>

                <table className="table" style={{ fontSize: 15 }}>
                  <thead>
                    <tr>
                      <th align="left">Histórico</th>
                      <th className="right">Entrada</th>
                      <th className="right">Saída</th>
                      <th className="right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arr.map((l) => (
                      <tr key={l.movimento_id}>
                        <td>{l.historico || "-"}</td>
                        <td className="right" style={{ color: "#1a7f37" }}>
                          {l.entrada ? money(l.entrada) : "—"}
                        </td>
                        <td className="right" style={{ color: "#b42318" }}>
                          {l.saida ? money(l.saida) : "—"}
                        </td>
                        <td className="right">
                          <b>{money(l.saldo ?? 0)}</b>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            <div className="row" style={{ justifyContent: "space-between" }}>
              <button
                type="button"
                onClick={() => {
                  setOffset((o) => Math.max(0, o - limit));
                  setTimeout(() => carregar(), 0);
                }}
                disabled={offset === 0}
                className="secondary"
              >
                ◀︎ Anterior
              </button>
              <div className="muted">
                página {Math.floor(offset / limit) + 1}
              </div>
              <button
                type="button"
                onClick={() => {
                  setOffset((o) => o + limit);
                  setTimeout(() => carregar(), 0);
                }}
                disabled={(dados?.itens?.length || 0) < limit}
                className="secondary"
              >
                Próxima ▶︎
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}