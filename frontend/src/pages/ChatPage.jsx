// src/pages/ChatPage.jsx
// RAG-powered AI chat with Hinglish toggle and voice input.

import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import HinglishToggle from "../components/HinglishToggle";
import VoiceButton from "../components/VoiceButton";
import InlineCode from "../components/InlineCode";
import api from "../services/api";

const SUGGESTIONS = [
  "Explain the login and authentication flow",
  "Where are database models defined?",
  "How does the order processing work?",
  "What async background tasks exist?",
];

export default function ChatPage() {
  const { analysis } = useApp();
  
  // Safety check for analysis
  if (!analysis) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-800/60 px-6 py-4">
          <h2 className="text-white font-semibold">AI Chat</h2>
          <p className="text-slate-500 text-xs mt-0.5">Ask questions about the codebase</p>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-white mb-3">RAG-Powered AI Chat</h3>
            <p className="text-slate-400 text-sm mb-6">
              Upload and analyze a repository first, then ask questions about architecture, flows, files, and more.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              ⬆ Upload Repository
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `I've analyzed **${analysis?.project_name}** (${analysis?.total_files} files). Ask me anything about the architecture, flows, authentication, database schema, or specific files.`,
      hinglish: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hinglishMode, setHinglishMode] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Preload voices for better TTS experience
  useEffect(() => {
    if ("speechSynthesis" in window) {
      // Trigger voices loading
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const history = newMsgs.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      
      // Call real backend chat API
      const response = await api.chat(analysis.repo_id, text, history, hinglishMode);
      
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: response.answer,
        hinglish: response.hinglish || null 
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "API error. Check your connection or API key.", hinglish: null },
      ]);
    }
    setLoading(false);
  };

  const toggleHinglish = async () => {
    const newMode = !hinglishMode;
    setHinglishMode(newMode);
    // Retroactively convert existing assistant messages
    if (newMode) {
      const updated = await Promise.all(
        messages.map(async (m) => {
          if (m.role === "assistant" && !m.hinglish) {
            try {
              const result = await api.convertHinglish(m.content, "casual");
              return { ...m, hinglish: result.hinglish };
            } catch {
              return m;
            }
          }
          return m;
        })
      );
      setMessages(updated);
    }
  };

  const speakText = (text, isHinglish = false) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      
      // Clean text: remove code blocks
      const cleanText = text.replace(/`[^`]+`/g, "");
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      if (isHinglish) {
        // For Hinglish: Prefer Indian English voices (better at mixing Hindi-English)
        // Indian English voices pronounce Romanized Hindi more naturally than pure Hindi voices
        const hinglishVoice = voices.find(v => 
          v.lang === 'en-IN' && (v.name.includes('Ravi') || v.name.includes('female'))
        ) || voices.find(v => 
          v.lang === 'en-IN'
        ) || voices.find(v => 
          v.lang.includes('hi') || v.lang.includes('HI')
        );
        
        if (hinglishVoice) {
          utterance.voice = hinglishVoice;
          utterance.lang = 'en-IN';  // Indian English handles Hinglish better
        }
        
        // Settings for natural Hinglish speech
        utterance.rate = 0.88;   // Slower for clarity of mixed language
        utterance.pitch = 1.15;  // Slightly higher (conversational, friendly)
        utterance.volume = 1.0;  // Full volume
      } else {
        // For English: Use Indian English voice (soft, human-like)
        const indianVoice = voices.find(v => 
          v.lang === 'en-IN' || v.name.includes('Indian')
        ) || voices.find(v => 
          v.lang.includes('en-GB') || v.lang.includes('en-US')
        );
        
        if (indianVoice) {
          utterance.voice = indianVoice;
          utterance.lang = 'en-IN';
        }
        
        // Settings for natural English speech
        utterance.rate = 0.92;   // Natural speaking speed
        utterance.pitch = 0.95;  // Slightly lower (professional, warm)
        utterance.volume = 1.0;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800/60 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-slate-300 text-sm font-medium">AI Chat</span>
          <code className="text-slate-600 text-xs font-mono">{analysis?.project_name}</code>
        </div>
        <HinglishToggle value={hinglishMode} onChange={toggleHinglish} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                AI
              </div>
            )}
            <div className="max-w-2xl">
              <div
                className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-indigo-950/50 border border-indigo-800/40 text-slate-200"
                    : "bg-slate-900/60 border border-slate-800/60 text-slate-300"
                }`}
              >
                <InlineCode text={m.content} />
              </div>

              {/* Hinglish box */}
              {m.role === "assistant" && hinglishMode && m.hinglish && (
                <div className="mt-2 bg-amber-950/30 border border-amber-800/40 rounded-xl px-4 py-3">
                  <div className="text-[10px] text-amber-600 mb-1.5 font-mono">अ HINGLISH</div>
                  <p className="text-amber-200/80 text-sm leading-relaxed">{m.hinglish}</p>
                </div>
              )}

              {/* Read aloud */}
              {m.role === "assistant" && (
                <button
                  onClick={() => {
                    const textToSpeak = hinglishMode && m.hinglish ? m.hinglish : m.content;
                    const isHinglish = hinglishMode && !!m.hinglish;
                    speakText(textToSpeak, isHinglish);
                  }}
                  className="text-[10px] text-slate-700 hover:text-slate-500 mt-1 ml-1 transition-colors"
                >
                  🔊 Read aloud
                </button>
              )}
            </div>

            {m.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs text-slate-300 shrink-0 mt-0.5">
                U
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              AI
            </div>
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length === 1 && (
        <div className="px-6 pb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs bg-slate-900/60 border border-slate-700/60 hover:border-indigo-700/60 text-slate-500 hover:text-indigo-300 px-3 py-1.5 rounded-lg transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="px-6 pb-4 pt-2 border-t border-slate-800/60 shrink-0">
        <div className="flex gap-2 items-end bg-slate-900/60 border border-slate-700/60 rounded-xl p-2">
          <textarea
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about the codebase… (Enter to send)"
            rows={1}
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-600 text-sm px-2 py-1.5 outline-none resize-none font-mono leading-relaxed"
            style={{ maxHeight: "120px" }}
          />
          <div className="flex gap-1.5 pb-1">
            <VoiceButton
              onTranscript={(t) => setInput(t)}
              listening={listening}
              setListening={setListening}
            />
            <button
              id="send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white flex items-center justify-center rounded-lg transition-colors"
            >
              ↑
            </button>
          </div>
        </div>
        <p className="text-slate-700 text-[10px] mt-1.5 text-center font-mono">
          Full repo context loaded · {analysis?.total_files} files · Claude-powered
        </p>
      </div>
    </div>
  );
}
