import { useState } from "react";
import VisaoGeral from "./VisaoGeral";
import NovoLancamento from "./NovoLancamento";
import Extrato from "./Extrato";

export default function App() {
  const [page, setPage] = useState<"visao"|"novo"|"extrato">("visao");

  return (
    <div className="app">
      <header className="row" style={{ justifyContent: "space-between", margin: "8px 0 12px" }}>
        <h1>SF Vanilla</h1>
      </header>

      {/* 👇 conteúdo com padding-bottom suficiente */}
      <main className="content">
        {page === "visao"   && <VisaoGeral />}
        {page === "novo"    && <NovoLancamento />}
        {page === "extrato" && <Extrato />}
      </main>

      <nav className="bottom-nav">
        <button onClick={() => setPage("visao")}>Visão</button>
        <button onClick={() => setPage("extrato")}>Extrato</button>
        <button onClick={() => setPage("novo")}>Lançar</button>
      </nav>

      {/*page !== "novo" && (
        <button className="fab" aria-label="Novo lançamento" onClick={() => setPage("novo")}>
          + Lançar
        </button>
      )*/}
    </div>
  );
}
