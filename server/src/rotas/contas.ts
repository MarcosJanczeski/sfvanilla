import { q } from "../db.js";
import { json, badRequest, parseJson } from "../utils.js";
import type { Conta } from "../types.js";
import type { IncomingMessage, ServerResponse } from "http";

export async function listarContas(_req: IncomingMessage, res: ServerResponse) {
  const contas = await q<Conta>(
    "SELECT id, codigo, nome, tipo, ativa, conta_pai_id FROM contas ORDER BY codigo"
  );
  return json(res, 200, contas);
}

export async function criarConta(req: IncomingMessage, res: ServerResponse) {
  const body = (await parseJson(req)) as Partial<Conta>;
  const { codigo, nome, tipo, conta_pai_id = null } = body;
  if (!codigo || !nome || !tipo) return badRequest(res, "codigo, nome e tipo são obrigatórios");

  const nova = await q<Conta>(
    "INSERT INTO contas (codigo, nome, tipo, conta_pai_id) VALUES ($1,$2,$3,$4) \
     RETURNING id, codigo, nome, tipo, ativa, conta_pai_id",
    [codigo, nome, tipo, conta_pai_id]
  );
  return json(res, 201, nova[0]);
}
