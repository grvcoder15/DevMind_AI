// src/components/Spinner.jsx
// Animated loading indicator.

export default function Spinner({ size = "sm" }) {
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <div
      className={`${sizeClass} border-2 border-indigo-400 border-t-transparent rounded-full animate-spin`}
    />
  );
}
