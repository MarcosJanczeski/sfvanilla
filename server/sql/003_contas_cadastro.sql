-- server/sql/010_contas_cadastro.sql
-- Criação/ajuste de colunas da tabela de contas

ALTER TABLE contas
  ADD COLUMN IF NOT EXISTS ativa boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();

-- Adiciona constraint de tipo se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'contas_tipo_chk'
  ) THEN
    ALTER TABLE contas
      ADD CONSTRAINT contas_tipo_chk
      CHECK (tipo IN ('ativo','passivo','patrimonio','receita','despesa'));
  END IF;
END$$;

-- Índice de unicidade para código
CREATE UNIQUE INDEX IF NOT EXISTS contas_codigo_unq
  ON contas (lower(codigo));

-- Função e trigger de atualização automática do updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'tg_set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION tg_set_updated_at()
    RETURNS trigger AS $tg$
    BEGIN
      NEW.updated_at := now();
      RETURN NEW;
    END;
    $tg$ LANGUAGE plpgsql;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'contas_set_updated_at'
  ) THEN
    CREATE TRIGGER contas_set_updated_at
    BEFORE UPDATE ON contas
    FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
  END IF;
END$$;
