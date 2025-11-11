import { useEffect } from "react";

type Item = {
  key: string;
  label: string;
  onClick: () => void;
  active?: boolean;
};

export default function NavDrawer({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: Item[];
}) {
  // Fecha com ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Evita scroll de fundo quando aberto
  useEffect(() => {
    const b = document.body;
    if (open) {
      const prev = b.style.overflow;
      b.style.overflow = "hidden";
      return () => {(b.style.overflow = prev);}
    }
  }, [open]);

  return (
    <>
      {/* backdrop */}
      <div
        className="drawer-backdrop"
        role="presentation"
        aria-hidden={!open}
        onClick={onClose}
        style={{ pointerEvents: open ? "auto" : "none", opacity: open ? 1 : 0 }}
      />

      {/* painel */}
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        <header className="drawer-header">
          <strong>SF Vanilla</strong>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar menu">✕</button>
        </header>

        <nav className="drawer-nav">
          {items.map((it) => (
            <button
              key={it.key}
              className={`drawer-item ${it.active ? "active" : ""}`}
              onClick={() => { it.onClick(); onClose(); }}
            >
              {it.label}
            </button>
          ))}
        </nav>

        <footer className="drawer-footer">
          <small className="muted">v0.1 • {new Date().getFullYear()}</small>
        </footer>
      </aside>
    </>
  );
}