import dotenv from "dotenv";
import { Pool, QueryResult, QueryResultRow, types } from "pg";
dotenv.config();

// Converte NUMERIC/DECIMAL (OID 1700) para number
types.setTypeParser(1700, (val) => (val === null ? null as any : parseFloat(val)));

// (opcional) Converte BIGINT/INT8 (OID 20) para number
// ⚠️ cuidado com overflow se usar valores > Number.MAX_SAFE_INTEGER
types.setTypeParser(20, (val) => (val === null ? null as any : parseInt(val, 10)));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Query tipada.
 * Ex.: const rows = await q<Conta>("SELECT id, nome FROM contas");
 */
export async function q<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = []
): Promise<T[]> {
  const res: QueryResult<T> = await pool.query<T>(text, params as unknown as any[]);
  return res.rows;
}

/** Uma linha ou null (útil p/ SELECT ... WHERE id=$1) */
export async function q1<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = []
): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}
