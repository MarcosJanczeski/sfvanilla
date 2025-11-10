import { createServer } from "http";
import { URL } from "url";
import { json } from "./utils.js";
import { listarContas, criarConta, atualizarConta, ativarConta, excluirConta } from "./rotas/contas.js";
import { criarLancamento } from "./rotas/lancamentos.js";
import { extrato } from "./rotas/extrato.js";
import { balancete } from "./rotas/balancete.js";
import { dre } from "./rotas/dre.js";

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.end();

  // Saude (se você tiver)
  // if (req.method === "GET" && req.url === "/saude") return json(res, 200, { ok: true, ts: Date.now() });

  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  // contas
  if (req.method === "GET" && url.pathname === "/contas") return listarContas(req, res);
  if (req.method === "POST" && url.pathname === "/contas") return criarConta(req, res);

  // /contas/:id (PUT, DELETE)
  if (url.pathname.startsWith("/contas/")) {
    const seg = url.pathname.split("/").filter(Boolean);
    // /contas/:id
    if (seg.length === 2) {
      const id = Number(seg[1]);
      if (req.method === "PUT")    return atualizarConta(req, res, id);
      if (req.method === "DELETE") return excluirConta(req, res, id);
    }
    // /contas/:id/ativar (PATCH)
    if (seg.length === 3 && seg[2] === "ativar" && req.method === "PATCH") {
      const id = Number(seg[1]);
      return ativarConta(req, res, id);
    }
  }

  // lançamentos
  if (req.method === "POST" && url.pathname === "/lancamentos") return criarLancamento(req, res);

  // extrato
  if (req.method === "GET" && url.pathname === "/extrato") return extrato(req, res);

  // balancete
  if (req.method === "GET" && url.pathname === "/balancete") return balancete(req, res);

  // dre
  if (req.method === "GET" && url.pathname === "/dre") return dre(req, res);

  // 404
  return json(res, 404, { erro: "Rota não encontrada" });
});

const PORT = Number(process.env.PORT || 3001);
server.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));