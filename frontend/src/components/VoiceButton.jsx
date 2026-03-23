// src/components/VoiceButton.jsx
// Mic button that uses the Web Speech API for voice input.
// Falls back to a simulated transcript in environments without speech support.

export default function VoiceButton({ onTranscript, listening, setListening }) {
  const handleClick = () => {
    if (listening) {
      setListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "en-IN";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (e) => {
        onTranscript(e.results[0][0].transcript);
        setListening(false);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);

      rec.start();
      setListening(true);
    } else {
      // Fallback for demo environments without microphone access
      onTranscript("Explain the authentication flow in this codebase");
    }
  };

  return (
    <button
      onClick={handleClick}
      title={listening ? "Stop listening" : "Voice input — click to speak"}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
        listening
          ? "bg-rose-600 animate-pulse text-white"
          : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
      }`}
    >
      {listening ? "⏹" : "🎤"}
    </button>
  );
}
