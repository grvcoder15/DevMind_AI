// src/components/HinglishToggle.jsx
// Toggle switch to switch between English and Hinglish responses.

export default function HinglishToggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      title={value ? "Switch to English" : "Switch to Hinglish"}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        value
          ? "bg-amber-950/60 border-amber-700/60 text-amber-300"
          : "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600"
      }`}
    >
      <span className="text-sm">अ</span>
      <span>Hinglish {value ? "ON" : "OFF"}</span>
      {/* Toggle pill */}
      <div className={`w-6 h-3 rounded-full transition-colors ${value ? "bg-amber-600" : "bg-slate-700"}`}>
        <div
          className="w-2.5 h-2.5 bg-white rounded-full transition-transform"
          style={{ marginTop: "1px", marginLeft: value ? "12px" : "2px" }}
        />
      </div>
    </button>
  );
}
