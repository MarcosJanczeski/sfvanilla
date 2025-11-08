import { createServer } from "http";
import { URL } from "url";
import { json } from "./utils.js";
import { listarContas, criarConta } from "./rotas/contas.js";
import { criarLancamento } from "./rotas/lancamentos.js";
import { extrato } from "./rotas/extrato.js";

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.end();

  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  // saúde
  if (req.method === "GET" && url.pathname === "/saude")
    return json(res, 200, { ok: true, ts: Date.now() });

  // contas
  if (req.method === "GET" && url.pathname === "/contas")  return listarContas(req, res);
  if (req.method === "POST" && url.pathname === "/contas") return criarConta(req, res);

  // lancamentos
  if (req.method === "POST" && url.pathname === "/lancamentos") return criarLancamento(req, res);

  // extrato
  if (req.method === "GET" && url.pathname === "/extrato") return extrato(req, res);

  // 404
  return json(res, 404, { erro: "Rota não encontrada" });
});

const PORT = Number(process.env.PORT || 3001);
server.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
