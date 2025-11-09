import { useEffect, useState } from "react";
import { type Conta, getContas } from "../api";

export default function Extrato() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [contaId, setContaId] = useState<number | null>(null);

  useEffect(() => {
    getContas().then(c => {
      setContas(c);
      if (c.length) setContaId(c[0].id);
    });
  }, []);

  return (
    <section className="card">
      <h2>Extrato</h2>
      <div className="row" style={{ margin: "12px 0" }}>
        <select value={contaId ?? ""} onChange={e=>setContaId(Number(e.target.value))}>
          {contas.map(c => <option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}
        </select>
      </div>
      <div className="muted">Próximo: ligar este seletor à chamada /extrato e listar as linhas com saldo na linha.</div>
    </section>
  );
}
