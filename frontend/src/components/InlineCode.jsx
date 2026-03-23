// src/components/InlineCode.jsx
// Renders markdown-style backtick code spans in text as <code> elements.

export default function InlineCode({ text }) {
  // Split by backtick-wrapped segments: `code`
  const parts = (text || "").split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, idx) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={idx}
            className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </>
  );
}
