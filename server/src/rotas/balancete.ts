import { q } from "../db.js";
import { json, badRequest } from "../utils.js";
import type { IncomingMessage, ServerResponse } from "http";
import type { BalanceteItem } from "../types.js";
import { URL } from "url";

function isDataISO(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * GET /balancete?de=YYYY-MM-DD&ate=YYYY-MM-DD&so_com_movimento=1
 * - de/ate opcionais; se ausentes, considera todo o histórico
 * - so_com_movimento=1 oculta contas com saldo_inicial=0 e variacao_periodo=0
 */
export async function balancete(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const de = url.searchParams.get("de");
  const ate = url.searchParams.get("ate");
  const soComMov = url.searchParams.get("so_com_movimento") === "1";

  if (de && !isDataISO(de)) return badRequest(res, "Parâmetro 'de' inválido (YYYY-MM-DD)");
  if (ate && !isDataISO(ate)) return badRequest(res, "Parâmetro 'ate' inválido (YYYY-MM-DD)");

  const rows = await q<BalanceteItem>(
    `
    WITH
    base AS (
      SELECT c.id conta_id, c.codigo, c.nome, c.tipo
      FROM contas c
      WHERE c.ativa = true
    ),
    antes AS (
      SELECT
        m.conta_id,
        COALESCE(SUM(m.debito),0)  AS deb,
        COALESCE(SUM(m.credito),0) AS cred
      FROM movimentos m
      JOIN lancamentos l ON l.id = m.lancamento_id
      WHERE ($1::date IS NOT NULL AND l.data < $1::date) OR ($1::date IS NULL)
      GROUP BY m.conta_id
    ),
    periodo AS (
      SELECT
        m.conta_id,
        COALESCE(SUM(m.debito),0)  AS deb,
        COALESCE(SUM(m.credito),0) AS cred
      FROM movimentos m
      JOIN lancamentos l ON l.id = m.lancamento_id
      WHERE
        ($1::date IS NULL OR l.data >= $1::date) AND
        ($2::date IS NULL OR l.data <= $2::date)
      GROUP BY m.conta_id
    )
    SELECT
      b.conta_id,
      b.codigo,
      b.nome,
      b.tipo,
      /* saldo inicial normalizado por tipo */
      CASE
        WHEN b.tipo IN ('ativo','despesa') THEN COALESCE(a.deb,0) - COALESCE(a.cred,0)
        ELSE COALESCE(a.cred,0) - COALESCE(a.deb,0)
      END AS saldo_inicial,
      /* entradas/saídas exibidas conforme tipo (para UI) */
      CASE
        WHEN b.tipo IN ('ativo','despesa') THEN COALESCE(p.deb,0)
        ELSE COALESCE(p.cred,0)
      END AS entrada_periodo,
      CASE
        WHEN b.tipo IN ('ativo','despesa') THEN COALESCE(p.cred,0)
        ELSE COALESCE(p.deb,0)
      END AS saida_periodo,
      /* variação impactando o saldo normalizado */
      CASE
        WHEN b.tipo IN ('ativo','despesa') THEN COALESCE(p.deb,0) - COALESCE(p.cred,0)
        ELSE COALESCE(p.cred,0) - COALESCE(p.deb,0)
      END AS variacao_periodo,
      /* saldo final = inicial + variação */
      (
        CASE
          WHEN b.tipo IN ('ativo','despesa') THEN COALESCE(a.deb,0) - COALESCE(a.cred,0)
          ELSE COALESCE(a.cred,0) - COALESCE(a.deb,0)
        END
      ) +
      (
        CASE
          WHEN b.tipo IN ('ativo','despesa') THEN COALESCE(p.deb,0) - COALESCE(p.cred,0)
          ELSE COALESCE(p.cred,0) - COALESCE(p.deb,0)
        END
      ) AS saldo_final
    FROM base b
    LEFT JOIN antes   a ON a.conta_id = b.conta_id
    LEFT JOIN periodo p ON p.conta_id = b.conta_id
    ORDER BY b.codigo
    `
    ,
    [de ?? null, ate ?? null]
  );

  const itens = soComMov
    ? rows.filter(r => (r.saldo_inicial || 0) !== 0 || (r.variacao_periodo || 0) !== 0)
    : rows;

  return json(res, 200, {
    intervalo: { de: de ?? null, ate: ate ?? null },
    itens
  });
}
