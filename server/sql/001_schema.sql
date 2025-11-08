CREATE TABLE IF NOT EXISTS contas (
  id            BIGSERIAL PRIMARY KEY,
  codigo        TEXT NOT NULL UNIQUE,
  nome          TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('ativo','passivo','patrimonio','receita','despesa')),
  conta_pai_id  BIGINT REFERENCES contas(id) ON DELETE SET NULL,
  ativa         BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS lancamentos (
  id         BIGSERIAL PRIMARY KEY,
  data       DATE NOT NULL,
  historico  TEXT,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS movimentos (
  id            BIGSERIAL PRIMARY KEY,
  lancamento_id BIGINT NOT NULL REFERENCES lancamentos(id) ON DELETE CASCADE,
  conta_id      BIGINT NOT NULL REFERENCES contas(id),
  debito        NUMERIC(14,2) NOT NULL DEFAULT 0,
  credito       NUMERIC(14,2) NOT NULL DEFAULT 0,
  CHECK (debito >= 0 AND credito >= 0),
  CHECK (NOT (debito = 0 AND credito = 0))
);

CREATE INDEX IF NOT EXISTS idx_mov_lanc ON movimentos(lancamento_id);
CREATE INDEX IF NOT EXISTS idx_mov_conta ON movimentos(conta_id);

CREATE OR REPLACE FUNCTION fn_lancamento_fechado() RETURNS TRIGGER AS $$
DECLARE
  sd NUMERIC(14,2);
  sc NUMERIC(14,2);
BEGIN
  SELECT COALESCE(SUM(debito),0), COALESCE(SUM(credito),0)
    INTO sd, sc
  FROM movimentos
  WHERE lancamento_id = NEW.lancamento_id;

  IF sd <> sc THEN
    RAISE EXCEPTION 'Lançamento % não fechado: débitos=% créditos=%', NEW.lancamento_id, sd, sc;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lancamento_fechado ON movimentos;
CREATE CONSTRAINT TRIGGER trg_lancamento_fechado
AFTER INSERT OR UPDATE OR DELETE ON movimentos
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION fn_lancamento_fechado();
