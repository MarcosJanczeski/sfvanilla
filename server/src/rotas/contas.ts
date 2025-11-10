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

function ok(res: ServerResponse, data = { ok: true }) {
  return json(res, 200, data);
}
function notEmpty(s: any) { return typeof s === "string" && s.trim() !== ""; }
const TIPOS = new Set(["ativo","passivo","patrimonio","receita","despesa"]);

/** PUT /contas/:id -> atualizar todos os campos principais */
export async function atualizarConta(req: IncomingMessage, res: ServerResponse, id: number) {
  try {
    const body = (await parseJson(req)) as Partial<Conta>;
    const { codigo, nome, tipo, ativa, conta_pai_id = null } = body;

    if (!Number.isFinite(id)) return badRequest(res, "ID inválido");
    if (!notEmpty(codigo) || !notEmpty(nome) || !TIPOS.has(tipo as string) || typeof ativa !== "boolean") {
      return badRequest(res, "Dados inválidos");
    }

    await q(
      `UPDATE contas
         SET codigo=$1, nome=$2, tipo=$3, ativa=$4, conta_pai_id=$5
       WHERE id=$6`,
      [String(codigo).trim(), String(nome).trim(), tipo, ativa, conta_pai_id, id]
    );
    return ok(res);
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("contas_codigo_unq")) return badRequest(res, "Código já existente");
    return badRequest(res, msg || "Falha ao atualizar");
  }
}

/** PATCH /contas/:id/ativar -> ativa/desativa (soft toggle) */
export async function ativarConta(req: IncomingMessage, res: ServerResponse, id: number) {
  const body = (await parseJson(req)) as { ativa?: boolean };
  const ativa = !!body?.ativa;
  if (!Number.isFinite(id)) return badRequest(res, "ID inválido");
  await q(`UPDATE contas SET ativa=$1 WHERE id=$2`, [ativa, id]);
  return ok(res);
}

/** DELETE /contas/:id -> “excluir” lógico (desativar) */
export async function excluirConta(_req: IncomingMessage, res: ServerResponse, id: number) {
  if (!Number.isFinite(id)) return badRequest(res, "ID inválido");
  await q(`UPDATE contas SET ativa=false WHERE id=$1`, [id]);
  return ok(res);
}