// src/components/Modal.jsx
// Modern modal dialog to replace browser alert()

export default function Modal({ isOpen, onClose, title, message, type = "info" }) {
  if (!isOpen) return null;

  const iconMap = {
    error: "❌",
    warning: "⚠️",
    success: "✅",
    info: "ℹ️",
  };

  const colorMap = {
    error: "text-red-400",
    warning: "text-amber-400",
    success: "text-emerald-400",
    info: "text-indigo-400",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/60 flex items-center gap-3">
          <span className="text-2xl">{iconMap[type]}</span>
          <h3 className={`text-lg font-semibold ${colorMap[type]}`}>
            {title || "Notice"}
          </h3>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/60 flex justify-end">
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
