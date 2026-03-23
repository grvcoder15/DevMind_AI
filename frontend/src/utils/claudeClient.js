// src/utils/claudeClient.js
// Direct Anthropic Claude API integration for the live demo prototype widget.
// In production, all AI calls are routed through the FastAPI backend.
// ⚠️  Never expose your real API key in a production frontend — use the backend.

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

/**
 * Send a message to Claude directly from the browser.
 * Used only in the frontend demo; production routes through /chat endpoint.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} systemPrompt
 * @returns {Promise<string>}
 */
export async function claudeChat(messages, systemPrompt = "") {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // NOTE: In a real app, never put your API key here.
      // Use a proxy endpoint on your backend instead.
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "No response received.";
}

/**
 * Convert text to Hinglish using Claude.
 * @param {string} text
 * @param {'casual'|'formal'|'developer'} style
 */
export async function convertToHinglish(text, style = "casual") {
  const prompts = {
    casual: `Convert to casual Hinglish (Hindi+English dev mix). Keep file names/code in English. Max 120 words. No preamble.\n\nText: ${text}`,
    formal: `Convert to formal Hindi-English for technical context. Keep technical terms in English. Max 150 words. Return only translation.\n\nText: ${text}`,
    developer: `Convert to ultra-casual Indian developer Hinglish. Use: bhai, dekh, simple hai, ekdam sahi. Keep code in English. Max 100 words. Return only translation.\n\nText: ${text}`,
  };

  return claudeChat(
    [{ role: "user", content: prompts[style] || prompts.casual }],
    "You convert English technical explanations into natural Hinglish."
  );
}

/**
 * Build a system prompt from the analysis object for codebase chat.
 * @param {object} analysis
 * @returns {string}
 */
export function buildChatSystemPrompt(analysis) {
  const a = analysis;
  return `You are an expert code analyst for: ${a._repoUrl || "the repository"}
Project: ${a.project_name} (${a.framework}/${a.language})
Summary: ${a.summary}
Architecture: ${a.architecture_overview}
Data flow: ${a.data_flow}
Key files: ${a.file_ranking.map((f) => `${f.file} — ${f.purpose}`).join(", ")}
Entry points: ${a.entry_points.join(", ")}

Answer concisely (<200 words). Reference specific files using backtick format. Be technically precise.`;
}
