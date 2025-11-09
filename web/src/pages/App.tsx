import { useState } from "react";
import VisaoGeral from "./VisaoGeral";
import NovoLancamento from "./NovoLancamento";
import Extrato from "./Extrato";

export default function App() {
  const [page, setPage] = useState<"visao" | "novo" | "extrato">("visao");

  return (
    <div className="app">
      <header className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h1>SF Vanilla</h1>
        <nav className="row" style={{ gap: 8 }}>
          <button onClick={() => setPage("visao")}>Visão Geral</button>
          <button onClick={() => setPage("novo")}>Novo Lançamento</button>
          <button onClick={() => setPage("extrato")}>Extrato</button>
        </nav>
      </header>

      {page === "visao" && <VisaoGeral />}
      {page === "novo" && <NovoLancamento />}
      {page === "extrato" && <Extrato />}

      {/* Botão Flutuante no canto */}
      <button
        onClick={() => setPage("novo")}
        style={{
          position: "fixed", right: 16, bottom: 16, borderRadius: "999px",
          padding: "14px 18px", fontSize: 16, boxShadow: "0 4px 12px rgba(0,0,0,.25)"
        }}
        aria-label="Novo lançamento rápido"
      >
        + Lançar
      </button>

    </div>
  );
}