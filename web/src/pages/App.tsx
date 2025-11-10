import { useState } from "react";
import VisaoGeral from "./VisaoGeral";
import NovoLancamento from "./NovoLancamento";
import Extrato from "./Extrato";
import Contas from "./Contas";

export default function App() {
  const [page, setPage] = useState<"visao"|"novo"|"extrato"|"contas">("visao");

  return (
    <div className="app">
      <header className="row" style={{ justifyContent: "space-between", margin: "8px 0 12px" }}>
        <h1>SF Vanilla</h1>
        <button className="secondary" onClick={() => setPage("contas")}>Contas</button>
      </header>

      <main className="content">
        {page === "visao"   && <VisaoGeral />}
        {page === "novo"    && <NovoLancamento />}
        {page === "extrato" && <Extrato />}
        {page === "contas"  && <Contas />}
      </main>

      <nav className="bottom-nav">
        <button onClick={() => setPage("visao")}>Visão</button>
        <button onClick={() => setPage("extrato")}>Extrato</button>
        <button onClick={() => setPage("novo")}>Lançar</button>
      </nav>
    </div>
  );
}
