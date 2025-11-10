import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  /** Valor em reais (ex.: 1234.56). Pode ser undefined no início */
  value?: number;
  /** Dispara sempre que o valor numérico muda */
  onChange?: (val: number) => void;
  /** Placeholder opcional */
  placeholder?: string;
  /** Desabilitar input */
  disabled?: boolean;
  /** Nome/id para formulários */
  name?: string;
  id?: string;
  /** Classes extras */
  className?: string;
  /** Auto focus */
  autoFocus?: boolean;
};

/**
 * MoneyInput
 * - Digite apenas números; a máscara monta R$ com 2 casas decimais (pt-BR)
 * - Mantém estado controlado externamente via `value` (number)
 * - Internamente usa "cents" (inteiro) para precisão em digitação
 */
export default function MoneyInput({
  value,
  onChange,
  placeholder,
  disabled,
  name,
  id,
  className,
  autoFocus,
}: Props) {
  // cents = valor * 100 como inteiro (ex.: 1234.56 => 123456)
  const initialCents = useMemo(() => toCents(value ?? 0), [value]);
  const [cents, setCents] = useState<number>(initialCents);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sempre que `value` externo mudar, sincroniza `cents`
  useEffect(() => {
    setCents(toCents(value ?? 0));
  }, [value]);

  // String formatada exibida
  const display = useMemo(() => formatCents(cents), [cents]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    // Aceita apenas dígitos, backspace, delete, setas, tab, home/end
    const allowed = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End",
    ];
    const isDigit = e.key >= "0" && e.key <= "9";

    // Bloqueia Enter para evitar submit acidental
    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }

    if (isDigit) {
      e.preventDefault();
      // shift left (cents * 10) e soma dígito
      const d = Number(e.key);
      const next = clampCents(cents * 10 + d);
      setCents(next);
      onChange?.(next / 100);
      // cursor no fim
      queuePlaceCursorEnd();
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      // remove último dígito (shift right)
      const next = Math.floor(cents / 10);
      setCents(next);
      onChange?.(next / 100);
      queuePlaceCursorEnd();
      return;
    }

    if (e.key === "Delete") {
      e.preventDefault();
      // Igual ao backspace para este modelo (pode customizar)
      const next = Math.floor(cents / 10);
      setCents(next);
      onChange?.(next / 100);
      queuePlaceCursorEnd();
      return;
    }

    if (!allowed.includes(e.key)) {
      // bloqueia outros (., , , +, -, etc)
      e.preventDefault();
    }
  }

  // Coloca o cursor no fim do texto após atualização
  function queuePlaceCursorEnd() {
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
  }

  // Permite colar números (com vírgula ou ponto); ignora letras
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    if (disabled) return;
    const text = e.clipboardData.getData("text");
    const next = toCents(fromHuman(text));
    setCents(next);
    onChange?.(next / 100);
    queuePlaceCursorEnd();
  }

  // Evita IME/teclados alternativos interferirem
  function handleBeforeInput(e: React.FormEvent<HTMLInputElement>) {
    // Este evento vem antes do keydown em alguns browsers; prevenimos mudanças não controladas
    e.preventDefault();
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      name={name}
      id={id}
      value={display}
      placeholder={placeholder ?? "0,00"}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onBeforeInput={handleBeforeInput}
      className={className}
      disabled={disabled}
      autoFocus={autoFocus}
      style={{ textAlign: "right" }}
      aria-label="Valor em reais"
    />
  );
}

/* ===== Helpers ===== */

function toCents(n: number): number {
  // protege contra NaN e mantém 2 casas
  const cents = Math.round((Number.isFinite(n) ? n : 0) * 100);
  return clampCents(cents);
}

function clampCents(c: number): number {
  // evita valores absurdos (opcional); 999.999.999,99 → 99.999.999.999 cents
  const MAX = 99_999_999_999;
  if (c < 0) return 0;
  if (c > MAX) return MAX;
  return c;
}

function formatCents(cents: number): string {
  const abs = Math.abs(cents);
  const inteiro = Math.floor(abs / 100);
  const dec = abs % 100;
  return `${inteiro.toLocaleString("pt-BR")},${dec.toString().padStart(2, "0")}`;
}

function fromHuman(s: string): number {
  // aceita "1.234,56" ou "1234.56" ou "123456" → number
  const clean = s
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(clean);
  return Number.isFinite(n) ? n : 0;
}
