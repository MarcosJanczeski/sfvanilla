import { useState, useMemo } from "react";
import VisaoGeral from "./VisaoGeral";
import NovoLancamento from "./NovoLancamento";
import Extrato from "./Extrato";
import Contas from "./Contas";
import NavDrawer from "../components/NavDrawer";
import HamburgerButton from "../components/HamburgerButton";

type Page = "visao" | "extrato" | "novo" | "contas" | "config";

export default function App() {
  const [page, setPage] = useState<Page>("visao");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const items = useMemo(() => ([
    { key: "visao", label: "Visão Geral", onClick: () => setPage("visao"), active: page === "visao" },
    { key: "extrato", label: "Extrato", onClick: () => setPage("extrato"), active: page === "extrato" },
    { key: "novo", label: "Novo lançamento", onClick: () => setPage("novo"), active: page === "novo" },
    { key: "contas", label: "Contas", onClick: () => setPage("contas"), active: page === "contas" },
    { key: "config", label: "Configurações", onClick: () => setPage("config"), active: page === "config" },
  ]), [page]);

  return (
    <div className="app">
      <header
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px 8px",
          borderBottom: "1px solid #eee",
        }}
      >
        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <HamburgerButton open={drawerOpen} onClick={() => setDrawerOpen(!drawerOpen)} />
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>SF Vanilla</h1>
        </div>

      </header>

      <main className="content">
        {page === "visao" && <VisaoGeral />}
        {page === "extrato" && <Extrato />}
        {page === "novo" && <NovoLancamento />}
        {page === "contas" && <Contas />}
        {page === "config" && (
          <section className="card">
            <h2>Configurações</h2>
            <div className="muted">Em breve: preferências, tema, moeda, backup, etc.</div>
          </section>
        )}
      </main>

      {/* Mantemos bottom-nav (mobile). Se preferir, pode remover com o drawer. 
      <nav className="bottom-nav">
        <button onClick={() => setPage("visao")}>Visão</button>
        <button onClick={() => setPage("extrato")}>Extrato</button>
        <button onClick={() => setPage("novo")}>Lançar</button>
      </nav>
      */}

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} items={items} />
    </div>
  );
}
