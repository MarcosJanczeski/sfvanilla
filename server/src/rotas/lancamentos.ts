import { pool, q } from "../db.js";
import { json, badRequest, parseJson } from "../utils.js";
import type { IncomingMessage, ServerResponse } from "http";
import type { LancamentoInput } from "../types.js";

function isDataISO(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function toValor(n: unknown): number {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v) || v < 0) throw new Error("Valor inválido (negativo ou não numérico).");
  return v;
}

export async function criarLancamento(req: IncomingMessage, res: ServerResponse) {
  const body = (await parseJson(req)) as LancamentoInput;
  if (!isDataISO(body?.data)) return badRequest(res, "data inválida (use YYYY-MM-DD)");
  if (!Array.isArray(body?.linhas) || body.linhas.length < 2) {
    return badRequest(res, "Informe pelo menos 2 linhas (débitos/créditos).");
  }

  for (const [i, l] of body.linhas.entries()) {
    if (!l?.conta_id) return badRequest(res, `Linha ${i + 1}: conta_id obrigatório`);
    const d = toValor(l.debito);
    const c = toValor(l.credito);
    if (d <= 0 && c <= 0) return badRequest(res, `Linha ${i + 1}: débito/crédito devem ser > 0`);
  }

  await pool.query("BEGIN");
  try {
    const cab = await q<{ id: number }>(
      "INSERT INTO lancamentos (data, historico) VALUES ($1,$2) RETURNING id",
      [body.data, body.historico ?? null]
    );
    const lancId = cab[0].id;

    for (const l of body.linhas) {
      const d = toValor(l.debito);
      const c = toValor(l.credito);
      await q(
        "INSERT INTO movimentos (lancamento_id, conta_id, debito, credito) VALUES ($1,$2,$3,$4)",
        [lancId, l.conta_id, d, c]
      );
    }

    await pool.query("COMMIT");
    return json(res, 201, { id: lancId });
  } catch (e: any) {
    await pool.query("ROLLBACK");
    return badRequest(res, e.message || "Falha ao registrar lançamento");
  }
}
