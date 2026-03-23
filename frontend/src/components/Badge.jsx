// src/components/Badge.jsx
// Reusable color-coded label chip.

export default function Badge({ children, color = "indigo" }) {
  const colorMap = {
    indigo: "bg-indigo-950 text-indigo-300 border-indigo-800",
    green:  "bg-emerald-950 text-emerald-300 border-emerald-800",
    amber:  "bg-amber-950 text-amber-300 border-amber-800",
    slate:  "bg-slate-800 text-slate-400 border-slate-700",
    rose:   "bg-rose-950 text-rose-300 border-rose-800",
    violet: "bg-violet-950 text-violet-300 border-violet-800",
  };
  const cls = colorMap[color] || colorMap.indigo;
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded border font-mono ${cls}`}>
      {children}
    </span>
  );
}
