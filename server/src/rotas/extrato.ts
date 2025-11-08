import { q, q1 } from "../db.js";
import { json, badRequest } from "../utils.js";
import type { IncomingMessage, ServerResponse } from "http";
import type { Conta, ExtratoItem } from "../types.js";
import { URL } from "url";

function isDataISO(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function extrato(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const conta_id = Number(url.searchParams.get("conta_id"));
  const de = url.searchParams.get("de");
  const ate = url.searchParams.get("ate");
  const limit = Number(url.searchParams.get("limit") || 50);
  const offset = Number(url.searchParams.get("offset") || 0);

  if (!conta_id) return badRequest(res, "Informe conta_id");
  if (de && !isDataISO(de)) return badRequest(res, "Parâmetro 'de' inválido (YYYY-MM-DD)");
  if (ate && !isDataISO(ate)) return badRequest(res, "Parâmetro 'ate' inválido (YYYY-MM-DD)");

  const conta = await q1<Pick<Conta, "id" | "codigo" | "nome" | "tipo">>(
    "SELECT id, codigo, nome, tipo FROM contas WHERE id=$1",
    [conta_id]
  );
  if (!conta) return badRequest(res, "Conta não encontrada");

  const itens = await q<ExtratoItem>(
    `
    WITH linhas AS (
      SELECT m.id movimento_id, l.id lancamento_id, l.data, COALESCE(l.historico,'') historico,
             m.debito, m.credito
      FROM movimentos m
      JOIN lancamentos l ON l.id = m.lancamento_id
      WHERE m.conta_id = $1
        AND ($2::date IS NULL OR l.data >= $2::date)
        AND ($3::date IS NULL OR l.data <= $3::date)
    )
    SELECT
      movimento_id,
      lancamento_id,
      data,
      historico,
      CASE WHEN $4 IN ('ativo','despesa') THEN debito  ELSE credito END AS entrada,
      CASE WHEN $4 IN ('ativo','despesa') THEN credito ELSE debito  END AS saida,
      SUM(
        CASE WHEN $4 IN ('ativo','despesa') THEN (debito - credito)
             ELSE (credito - debito)
        END
      ) OVER (ORDER BY data, lancamento_id, movimento_id) AS saldo
    FROM linhas
    ORDER BY data, lancamento_id, movimento_id
    LIMIT $5 OFFSET $6
    `,
    [conta_id, de ?? null, ate ?? null, conta.tipo, limit, offset]
  );

  return json(res, 200, {
    conta,
    intervalo: { de: de ?? null, ate: ate ?? null },
    itens,
    paginacao: { limit, offset },
  });
}
