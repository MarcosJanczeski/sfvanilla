import { useEffect, useMemo, useState } from "react";
import { getBalancete, getDre, type BalanceteItem } from "../api";

const hoje = new Date();
const yyyy = hoje.getFullYear();
const mm = String(hoje.getMonth() + 1).padStart(2, "0");
const dePadrao = `${yyyy}-${mm}-01`;
const atePadrao = `${yyyy}-${mm}-${new Date(yyyy, hoje.getMonth()+1, 0).getDate().toString().padStart(2,"0")}`;
const fmt = (v:number)=>v.toLocaleString("pt-BR",{ style:"currency", currency:"BRL" });

export default function VisaoGeral() {
  const [de, setDe] = useState(dePadrao);
  const [ate, setAte] = useState(atePadrao);
  const [bal, setBal] = useState<BalanceteItem[]>([]);
  const [receitas, setReceitas] = useState(0);
  const [despesas, setDespesas] = useState(0);
  const [resultado, setResultado] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setLoading(true); setErro(null);
    try {
      const b = await getBalancete({ de, ate, so: true });
      setBal(b.itens);
      const d = await getDre(de, ate);
      setReceitas(d.totais.total_receitas);
      setDespesas(d.totais.total_despesas);
      setResultado(d.totais.resultado);
    } catch (e:any) { setErro(e.message || "Falha ao carregar"); }
    finally { setLoading(false); }
  }
  useEffect(() => { carregar(); }, []);

  const saldoAtivo = useMemo(() =>
    bal.filter(i => i.tipo === "ativo").reduce((s, i) => s + i.saldo_final, 0), [bal]);

  const alerta = resultado < 0 || (receitas > 0 && despesas >= receitas);

  return (
    <section className="fields">
      <div className="card">
        <div className="fields">
          <div className="field">
            <div className="muted">Período</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <input type="date" value={de} onChange={e=>setDe(e.target.value)} />
              <span>—</span>
              <input type="date" value={ate} onChange={e=>setAte(e.target.value)} />
              <button onClick={carregar}>Atualizar</button>
            </div>
          </div>
        </div>
      </div>

      {erro && <div className="notice">{erro}</div>}
      {loading && <div className="card">Carregando…</div>}

      {!loading && !erro && (
        <>
          <div className="grid cols-3">
            <div className="card" style={{ background: "#e0f7fa" }}>
              <div className="muted">Saldo de Ativos</div>
              <h2>{fmt(saldoAtivo)}</h2>
            </div>
            <div className="card" style={{ background: "#f1f5f9" }}>
              <div className="muted">Receitas (mês)</div>
              <h2 style={{ color: "#1a7f37" }}>{fmt(receitas)}</h2>
            </div>
            <div className="card" style={{ background: "#fef2f2" }}>
              <div className="muted">Despesas (mês)</div>
              <h2 style={{ color: "#b42318" }}>{fmt(despesas)}</h2>
            </div>
          </div>

          <div className="card" style={{ background: "#eef6ff" }}>
            <div className="muted">Resultado do mês</div>
            <h2 style={{ color: resultado >= 0 ? "#1a7f37" : "#b42318" }}>{fmt(resultado)}</h2>
          </div>

          {alerta && (
            <div className="notice">
              ⚠️ Resultado negativo ou despesas ≥ receitas neste período.
            </div>
          )}
        </>
      )}
    </section>
  );
}
