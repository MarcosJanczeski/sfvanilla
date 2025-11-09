import { useEffect, useMemo, useState } from "react";
import { getBalancete, getDre, type BalanceteItem } from "../api";

function fmt(v: number) { return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }
const hoje = new Date();
const yyyy = hoje.getFullYear();
const mm = String(hoje.getMonth() + 1).padStart(2, "0");
const dePadrao = `${yyyy}-${mm}-01`;
const atePadrao = `${yyyy}-${mm}-${new Date(yyyy, hoje.getMonth()+1, 0).getDate().toString().padStart(2,"0")}`;

export default function VisaoGeral() {
  const [de, setDe] = useState(dePadrao);
  const [ate, setAte] = useState(atePadrao);
  const [bal, setBal] = useState<BalanceteItem[]>([]);
  const [dre, setDre] = useState<{ receitas: number; despesas: number; resultado: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setLoading(true); setErro(null);
    try {
      const b = await getBalancete({ de, ate, so: true });
      setBal(b.itens);
      const d = await getDre(de, ate);
      setDre({ receitas: d.totais.total_receitas, despesas: d.totais.total_despesas, resultado: d.totais.resultado });
    } catch (e:any) { setErro(e.message || "Falha ao carregar"); }
    finally { setLoading(false); }
  }
  useEffect(() => { carregar(); }, []);

  const saldoAtivo = useMemo(() =>
    bal.filter(i => i.tipo === "ativo").reduce((s, i) => s + i.saldo_final, 0), [bal]);

  const relaçãoRD = dre ? (dre.despesas / Math.max(dre.receitas, 1)) : 0;
  const alertaRisco = dre ? (dre.resultado < 0 || relaçãoRD >= 1) : false;

  return (
    <>
      <section className="card row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="muted">Período</div>
          <div className="row">
            <input type="date" value={de} onChange={e=>setDe(e.target.value)} />
            <span>—</span>
            <input type="date" value={ate} onChange={e=>setAte(e.target.value)} />
            <button onClick={carregar}>Atualizar</button>
          </div>
        </div>
        <div><span className="badge">Visão Geral</span></div>
      </section>

      {erro && <section className="notice">{erro}</section>}
      {loading && <section className="card">Carregando…</section>}

      {!loading && !erro && (
        <>
          <section className="grid cols-3">
            <div className="card">
              <div className="muted">Saldo de Ativos</div>
              <h2>{fmt(saldoAtivo)}</h2>
            </div>
            <div className="card">
              <div className="muted">Receitas (mês)</div>
              <h2 className="success">{fmt(dre?.receitas || 0)}</h2>
              <div className="muted">Despesas (mês): <b className="danger">{fmt(dre?.despesas || 0)}</b></div>
            </div>
            <div className="card">
              <div className="muted">Resultado (mês)</div>
              <h2 style={{ color: (dre?.resultado ?? 0) >= 0 ? "#1a7f37" : "#b42318" }}>
                {fmt(dre?.resultado || 0)}
              </h2>
            </div>
          </section>

          {alertaRisco && (
            <section className="notice card">
              ⚠️ <b>Alerta:</b> Resultado do período negativo ou despesas ≥ receitas.
            </section>
          )}

          <section className="card">
            <h3 style={{ marginBottom: 8 }}>Resumo por Conta (com movimento)</h3>
            <table className="table">
              <thead>
                <tr>
                  <th align="left">Código</th>
                  <th align="left">Conta</th>
                  <th align="left">Tipo</th>
                  <th className="right">Saldo Inicial</th>
                  <th className="right">Variação</th>
                  <th className="right">Saldo Final</th>
                </tr>
              </thead>
              <tbody>
                {bal.map(i => (
                  <tr key={i.conta_id}>
                    <td>{i.codigo}</td>
                    <td>{i.nome}</td>
                    <td>{i.tipo}</td>
                    <td className="right">{fmt(i.saldo_inicial)}</td>
                    <td className="right" style={{ color: i.variacao_periodo >= 0 ? "#1a7f37" : "#b42318" }}>
                      {fmt(i.variacao_periodo)}
                    </td>
                    <td className="right"><b>{fmt(i.saldo_final)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </>
  );
}
