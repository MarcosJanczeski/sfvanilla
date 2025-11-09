import { useState } from "react";
import VisaoGeral from "./VisaoGeral";
import NovoLancamento from "./NovoLancamento";
import Extrato from "./Extrato";

export default function App() {
  const [page, setPage] = useState<"visao"|"novo"|"extrato">("visao");

  return (
    <div className="app">
      {/* Header simples (fica mais útil no desktop) */}
      <header className="row" style={{ justifyContent: "space-between", margin: "8px 0 12px" }}>
        <h1>SF Vanilla</h1>
        <nav className="row" style={{ gap: 8, display: "none" }}>
          {/* escondemos no mobile; desktop usa teclado/mouse */}
          <button onClick={() => setPage("visao")}>Visão Geral</button>
          <button onClick={() => setPage("novo")}>Novo Lançamento</button>
          <button onClick={() => setPage("extrato")}>Extrato</button>
        </nav>
      </header>

      {page === "visao"   && <VisaoGeral />}
      {page === "novo"    && <NovoLancamento />}
      {page === "extrato" && <Extrato />}

      {/* Bottom Nav (mobile) */}
      <nav className="bottom-nav">
        <button onClick={() => setPage("visao")}>Visão</button>
        <button onClick={() => setPage("extrato")}>Extrato</button>
        <button onClick={() => setPage("novo")}>Lançar</button>
      </nav>

      {/* FAB para 1 toque até lançar */}
      {page !== "novo" && (
        <button className="fab" aria-label="Novo lançamento" onClick={() => setPage("novo")}>
          + Lançar
        </button>
      )}
    </div>
  );
}
