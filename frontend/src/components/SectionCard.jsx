// src/components/SectionCard.jsx
// Wrapper card for dashboard content sections.

export default function SectionCard({ title, children }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-5">
      <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}
