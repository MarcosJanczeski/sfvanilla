import { useEffect, useState } from "react";
import { getContas, postLancamento } from "../api";
import type { Conta } from "../api";
import { enqueue, flush, onReonline } from "../offline";

const hojeISO = new Date().toISOString().slice(0, 10);

export default function NovoLancamento() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [data, setData] = useState(hojeISO);
  const [historico, setHistorico] = useState("");
  const [tipo, setTipo] = useState<"despesa" | "receita" | "transferencia">("despesa");
  const [categoriaId, setCategoriaId] = useState<number | "">("");
  const [meioId, setMeioId] = useState<number | "">("");
  const [valor, setValor] = useState<number>(0);
  const [msg, setMsg] = useState<string | null>(null);

  // 🔄 quando voltar conexão, tenta reenviar lançamentos pendentes
  useEffect(() => {
    //flush((p) => postLancamento(p));
    //onReonline(() => flush((p) => postLancamento(p)));
    flush(async (p) => { await postLancamento(p); });
    onReonline(() => flush(async (p) => { await postLancamento(p); }));

  }, []);

  useEffect(() => {
    getContas().then(setContas);
  }, []);

  const contasAtivo = contas.filter((c) => c.tipo === "ativo");
  const contasDespesa = contas.filter((c) => c.tipo === "despesa");
  const contasReceita = contas.filter((c) => c.tipo === "receita");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      if (!valor || valor <= 0) throw new Error("Informe um valor maior que 0");
      let linhas: { conta_id: number; debito?: number; credito?: number }[] = [];

      if (tipo === "despesa") {
        if (!categoriaId || !meioId) throw new Error("Selecione categoria e pago com");
        linhas = [
          { conta_id: Number(categoriaId), debito: valor },
          { conta_id: Number(meioId), credito: valor },
        ];
      } else if (tipo === "receita") {
        if (!categoriaId || !meioId) throw new Error("Selecione origem e recebido em");
        linhas = [
          { conta_id: Number(meioId), debito: valor },
          { conta_id: Number(categoriaId), credito: valor },
        ];
      } else {
        const origem = Number(meioId);
        const destino = Number(categoriaId);
        if (!origem || !destino || origem === destino)
          throw new Error("Selecione contas distintas");
        linhas = [
          { conta_id: destino, debito: valor },
          { conta_id: origem, credito: valor },
        ];
      }

      const payload = { data, historico, linhas };
      try {
        await postLancamento(payload);
        setMsg("✅ Lançamento registrado com sucesso!");
      } catch {
        enqueue(payload);
        setMsg("📱 Sem internet — lançamento salvo localmente e será enviado depois.");
      }

      // mantém tipo e contas p/ lançamentos repetidos
      setHistorico("");
      setValor(0);
      (document.getElementById("valor") as HTMLInputElement)?.focus();
    } catch (e: any) {
      setMsg(e.message || "Falha ao salvar lançamento");
    }
  }

  return (
    <section className="card">
      <h2>Novo Lançamento</h2>
      <form onSubmit={salvar} className="grid" style={{ gap: 12 }}>
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <label className="muted">Data</label>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />

          <label className="muted">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
            <option value="transferencia">Transferência</option>
          </select>

          <label className="muted">Valor</label>
          <input
            id="valor"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={valor || ""}
            autoFocus
            onChange={(e) => setValor(Number(e.target.value))}
          />
        </div>

        <div className="row" style={{ flexWrap: "wrap", gap: 12 }}>
          {tipo === "despesa" && (
            <>
              <div>
                <div className="muted">Categoria (Despesa)</div>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(Number(e.target.value))}
                >
                  <option value="">Selecione…</option>
                  {contasDespesa.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="muted">Pago com (Ativo)</div>
                <select value={meioId} onChange={(e) => setMeioId(Number(e.target.value))}>
                  <option value="">Selecione…</option>
                  {contasAtivo.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {tipo === "receita" && (
            <>
              <div>
                <div className="muted">Origem (Receita)</div>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(Number(e.target.value))}
                >
                  <option value="">Selecione…</option>
                  {contasReceita.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="muted">Recebido em (Ativo)</div>
                <select value={meioId} onChange={(e) => setMeioId(Number(e.target.value))}>
                  <option value="">Selecione…</option>
                  {contasAtivo.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {tipo === "transferencia" && (
            <>
              <div>
                <div className="muted">Origem (Ativo)</div>
                <select value={meioId} onChange={(e) => setMeioId(Number(e.target.value))}>
                  <option value="">Selecione…</option>
                  {contasAtivo.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="muted">Destino (Ativo)</div>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(Number(e.target.value))}
                >
                  <option value="">Selecione…</option>
                  {contasAtivo.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div>
          <div className="muted">Histórico</div>
          <input
            placeholder="Ex.: Mercado, Salário, Transferência..."
            value={historico}
            onChange={(e) => setHistorico(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="muted">Débitos = Créditos garantido ✅</div>
          <button type="submit">Salvar</button>
        </div>

        {msg && <div className="notice" style={{ marginTop: 8 }}>{msg}</div>}
      </form>
    </section>
  );
}
