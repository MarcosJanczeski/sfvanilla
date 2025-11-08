import { q } from "../db.js";
import { json, badRequest } from "../utils.js";
import type { IncomingMessage, ServerResponse } from "http";
import type { DreItem } from "../types.js";
import { URL } from "url";

function isDataISO(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * GET /dre?de=YYYY-MM-DD&ate=YYYY-MM-DD
 * - receita: valor = créditos - débitos
 * - despesa: valor = débitos  - créditos
 */
export async function dre(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const de = url.searchParams.get("de");
  const ate = url.searchParams.get("ate");

  if (!de || !ate) return badRequest(res, "Informe 'de' e 'ate' (YYYY-MM-DD)");
  if (!isDataISO(de) || !isDataISO(ate)) return badRequest(res, "Datas inválidas (YYYY-MM-DD)");

  const itens = await q<DreItem>(
    `
    WITH base AS (
      SELECT c.codigo, c.nome, c.tipo,
             COALESCE(SUM(m.debito),0)  AS deb,
             COALESCE(SUM(m.credito),0) AS cred
      FROM contas c
      JOIN movimentos m ON m.conta_id = c.id
      JOIN lancamentos l ON l.id = m.lancamento_id
      WHERE c.tipo IN ('receita','despesa')
        AND l.data BETWEEN $1::date AND $2::date
      GROUP BY c.codigo, c.nome, c.tipo
    )
    SELECT
      codigo,
      nome,
      tipo,
      CASE
        WHEN tipo = 'receita' THEN cred - deb
        ELSE deb - cred
      END AS valor
    FROM base
    ORDER BY tipo, codigo
    `,
    [de, ate]
  );

  const total_receitas = itens
    .filter(i => i.tipo === "receita")
    .reduce((s, i) => s + (i.valor || 0), 0);

  const total_despesas = itens
    .filter(i => i.tipo === "despesa")
    .reduce((s, i) => s + (i.valor || 0), 0);

  const resultado = total_receitas - total_despesas;

  return json(res, 200, {
    intervalo: { de, ate },
    receitas: itens.filter(i => i.tipo === "receita"),
    despesas: itens.filter(i => i.tipo === "despesa"),
    totais: { total_receitas, total_despesas, resultado }
  });
}
