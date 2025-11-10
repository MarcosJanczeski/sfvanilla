// web/src/pages/Contas.tsx
import { useEffect, useMemo, useState } from "react";
import { getContas, createConta, updateConta, toggleConta, deleteConta, type Conta } from "../api";

const TIPOS: Conta["tipo"][] = ["ativo","passivo","patrimonio","receita","despesa"];

export default function Contas() {
  const [lista, setLista] = useState<Conta[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState<{ id?: number; codigo: string; nome: string; tipo: Conta["tipo"]; ativa: boolean; conta_pai_id: number | null }>({
    codigo: "", nome: "", tipo: "ativo", ativa: true, conta_pai_id: null
  });

  async function carregar() {
    setLoading(true); setErro(null);
    try { setLista(await getContas()); }
    catch (e:any) { setErro(e.message || "Falha ao listar contas"); }
    finally { setLoading(false); }
  }
  useEffect(() => { carregar(); }, []);

  const filtrada = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    if (!f) return lista;
    return lista.filter(c =>
      c.codigo.toLowerCase().includes(f) ||
      c.nome.toLowerCase().includes(f) ||
      c.tipo.toLowerCase().includes(f)
    );
  }, [lista, filtro]);

  function editar(c: Conta) {
    setForm({ id: c.id, codigo: c.codigo, nome: c.nome, tipo: c.tipo, ativa: c.ativa, conta_pai_id: c.conta_pai_id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar() {
    try {
      setLoading(true); setErro(null);
      const payload = {
        codigo: form.codigo.trim(),
        nome: form.nome.trim(),
        tipo: form.tipo,
        conta_pai_id: form.conta_pai_id ?? null,
      };
      if (!payload.codigo || !payload.nome) return setErro("Informe código e nome");

      if (form.id) {
        await updateConta(form.id, { ...payload, ativa: form.ativa });
      } else {
        const r = await createConta(payload);
        setForm((s) => ({ ...s, id: r.id }));
      }
      await carregar();
    } catch (e:any) {
      setErro(e.message || "Falha ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function ativar(c: Conta, ativa: boolean) {
    setLoading(true);
    try { await toggleConta(c.id, ativa); await carregar(); }
    catch (e:any) { setErro(e.message || "Falha ao alterar status"); }
    finally { setLoading(false); }
  }

  async function excluir(c: Conta) {
    if (!confirm(`Desativar conta "${c.codigo} — ${c.nome}"?`)) return;
    setLoading(true);
    try { await deleteConta(c.id); await carregar(); }
    catch (e:any) { setErro(e.message || "Falha ao desativar"); }
    finally { setLoading(false); }
  }

  return (
    <section className="fields">
      <div className="card">
        <h2 style={{ marginBottom: 8 }}>{form.id ? "Editar Conta" : "Nova Conta"}</h2>
        <div className="fields">
          <div className="field">
            <div className="muted">Código</div>
            <input value={form.codigo} onChange={(e)=>setForm({...form, codigo:e.target.value})} placeholder="ex: 1.1.3" />
          </div>
          <div className="field">
            <div className="muted">Nome</div>
            <input value={form.nome} onChange={(e)=>setForm({...form, nome:e.target.value})} placeholder="ex: Poupança" />
          </div>
          <div className="field">
            <div className="muted">Tipo</div>
            <select value={form.tipo} onChange={(e)=>setForm({...form, tipo: e.target.value as Conta["tipo"]})}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <div className="muted">Conta Pai (opcional)</div>
            <select
              value={form.conta_pai_id ?? ""}
              onChange={(e)=>setForm({...form, conta_pai_id: e.target.value ? Number(e.target.value) : null})}
            >
              <option value="">— sem pai —</option>
              {lista.map(c => (
                <option key={c.id} value={c.id}>
                  {c.codigo} — {c.nome}
                </option>
              ))}
            </select>
          </div>
          {form.id && (
            <label className="row" style={{ gap: 8, alignItems: "center", flex: "0 0 auto" }}>
              <input type="checkbox" checked={form.ativa} onChange={(e)=>setForm({...form, ativa: e.target.checked})} />
              Ativa
            </label>
          )}
          <div className="row" style={{ gap: 8 }}>
            <button onClick={salvar} disabled={loading}>Salvar</button>
            {form.id && (
              <button className="secondary" onClick={() => setForm({ codigo:"", nome:"", tipo:"ativo", ativa:true, conta_pai_id:null })}>
                Novo
              </button>
            )}
          </div>
          {erro && <div className="notice">{erro}</div>}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3>Contas</h3>
          <input
            placeholder="Filtrar por código, nome ou tipo"
            value={filtro}
            onChange={(e)=>setFiltro(e.target.value)}
          />
        </div>

        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Status</th>
              <th className="right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrada.map(c => (
              <tr key={c.id}>
                <td>{c.codigo}</td>
                <td>{c.nome}</td>
                <td>{c.tipo}</td>
                <td>{c.ativa ? "Ativa" : "Inativa"}</td>
                <td className="right">
                  <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                    <button className="secondary" onClick={() => editar(c)}>Editar</button>
                    <button className="secondary" onClick={() => ativar(c, !c.ativa)}>
                      {c.ativa ? "Desativar" : "Ativar"}
                    </button>
                    <button className="secondary" onClick={() => excluir(c)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtrada.length && (
              <tr><td colSpan={5} className="muted">Nenhuma conta encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
