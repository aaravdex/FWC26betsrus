import { factAt } from "@/lib/facts";

// Presentational stat block for grids / info panels.
export function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "default" | "gold" | "accent" | "up" | "down";
}) {
  const valueTone =
    tone === "gold"
      ? "text-gold-soft"
      : tone === "accent"
        ? "text-accent-soft"
        : tone === "up"
          ? "text-up"
          : tone === "down"
            ? "text-down"
            : "text-slate-100";
  return (
    <div className="card card-hover p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 font-mono text-xl font-semibold ${valueTone}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

// Static fact card (server-rendered) for filling sidebar / grid space.
export function FactCard({ index = 0 }: { index?: number }) {
  return (
    <div className="card p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <span aria-hidden>⚽</span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gold-soft">
          Football fact
        </span>
      </div>
      <p className="text-sm leading-relaxed text-slate-300">{factAt(index)}</p>
    </div>
  );
}

// A small labelled info panel (e.g. per-match / per-team context).
export function InfoPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </div>
      {children}
    </div>
  );
}
