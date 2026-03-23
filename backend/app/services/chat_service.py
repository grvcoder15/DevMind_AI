"""
app/services/chat_service.py — RAG-based chat service.
Retrieves relevant code chunks via FAISS, builds a rich system prompt,
calls the LLM, and optionally converts the response to Hinglish.
"""

import logging
from typing import List

from app.services.ai_service import llm, convert_to_hinglish

logger = logging.getLogger(__name__)

SYSTEM_TEMPLATE = """\
You are an expert code analyst for the repository: {project_name} ({framework}/{language}).

=== Project Summary ===
{summary}

=== Architecture ===
{architecture}

=== Data Flow ===
{data_flow}

=== Key Files ===
{key_files}

=== Entry Points ===
{entry_points}

=== Relevant Code Chunks (from vector search) ===
{chunks}

IMPORTANT INSTRUCTIONS:
- Answer questions concisely (<250 words)
- Reference specific files using backtick format `file.py`
- Be technically precise. If unsure, say so clearly
- {language_instruction}
"""

ENGLISH_INSTRUCTION = "ALWAYS respond in clear, professional English, regardless of the question's language"
HINGLISH_INSTRUCTION = "You may respond in either English or natural Hinglish based on the question"


class ChatService:
    def __init__(self, vector_store):
        self.vector_store = vector_store

    async def chat(
        self,
        repo_id:  str,
        question: str,
        history:  List[dict],
        analysis: dict,
        hinglish: bool = False,
    ) -> dict:
        # Retrieve relevant code chunks via vector search
        chunks = await self.vector_store.search(repo_id, question, top_k=5)
        chunk_text = "\n\n".join(
            f"[{c['file']}]\n{c['chunk'][:400]}"
            for c in chunks
        ) or "No specific code chunks retrieved."

        # Choose language instruction based on hinglish mode
        language_instruction = HINGLISH_INSTRUCTION if hinglish else ENGLISH_INSTRUCTION

        system = SYSTEM_TEMPLATE.format(
            project_name=analysis.get("project_name", "Unknown"),
            framework=analysis.get("framework", "Unknown"),
            language=analysis.get("language", "Unknown"),
            summary=analysis.get("summary", ""),
            architecture=analysis.get("architecture_overview", ""),
            data_flow=analysis.get("data_flow", ""),
            key_files="\n".join(
                f"  {f['file']} — {f['purpose']}"
                for f in analysis.get("file_ranking", [])[:8]
            ),
            entry_points=", ".join(analysis.get("entry_points", [])),
            chunks=chunk_text,
            language_instruction=language_instruction,
        )

        # Build message history (last 10 turns)
        messages = [
            {"role": m["role"], "content": m["content"]}
            for m in history[-10:]
        ]
        messages.append({"role": "user", "content": question})

        answer = await llm.complete(system=system, messages=messages, temperature=0.3)

        hinglish_text = None
        if hinglish:
            try:
                hinglish_text = await convert_to_hinglish(answer, "casual")
            except Exception as e:
                logger.warning(f"Hinglish conversion failed: {e}")

        sources = list({c["file"] for c in chunks if c.get("file")})

        return {
            "answer":   answer,
            "hinglish": hinglish_text,
            "sources":  sources,
        }
