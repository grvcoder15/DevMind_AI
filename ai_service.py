"""
app/services/ai_service.py — LLM abstraction layer
Supports Anthropic Claude and OpenAI with a unified interface.
"""
import logging
from typing import List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMClient:
    """
    Unified LLM interface — swap providers via config without changing service code.
    All calls are async. Returns plain text string.
    """

    async def complete(
        self,
        messages: List[dict],
        system: str = "",
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        temp = temperature if temperature is not None else settings.TEMPERATURE
        tokens = max_tokens or settings.MAX_TOKENS

        if settings.LLM_PROVIDER == "anthropic":
            return await self._anthropic(messages, system, temp, tokens)
        else:
            return await self._openai(messages, system, temp, tokens)

    async def _anthropic(self, messages, system, temperature, max_tokens) -> str:
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        resp = await client.messages.create(
            model=settings.LLM_MODEL,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=messages,
        )
        return resp.content[0].text.strip()

    async def _openai(self, messages, system, temperature, max_tokens) -> str:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        all_msgs = ([{"role": "system", "content": system}] if system else []) + messages
        resp = await client.chat.completions.create(
            model="gpt-4o",
            temperature=temperature,
            max_tokens=max_tokens,
            messages=all_msgs,
        )
        return resp.choices[0].message.content.strip()


# Global singleton
llm = LLMClient()


# ─────────────────────────────────────────────────────────────────────────────
"""
app/services/hinglish_service.py — Hinglish conversion with quality tiers
"""

HINGLISH_PROMPTS = {
    "casual": """\
Convert the following English technical explanation to casual Hinglish (Hindi + English mix).
Style rules:
- Use common Hindi words: yahan, matlab, basically, dekho, samajhna, hota hai, ek dum, aur, phir, isliye
- Keep ALL code identifiers, file names, function names in English
- Sound like a senior Indian developer explaining to a junior colleague casually
- Max 150 words
- Return ONLY the Hinglish text, no preamble

Text: {text}""",

    "formal": """\
Convert to formal Hindi-English (Hinglish) for a technical documentation context.
Use professional Hindi words, keep all technical terms in English.
Sound like a technical trainer. Max 200 words. Return only the translation.

Text: {text}""",

    "developer": """\
Convert to ultra-casual Indian developer Hinglish.
Use slang like: "bhai", "dekh", "simple hai", "kuch nahi", "ekdam sahi", "chal jata hai"
Keep all code in English. Max 120 words. Return only the translation.

Text: {text}""",
}


async def convert_to_hinglish(text: str, style: str = "casual") -> str:
    """Convert English technical text to Hinglish."""
    prompt = HINGLISH_PROMPTS.get(style, HINGLISH_PROMPTS["casual"]).format(text=text)
    try:
        return await llm.complete(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=400,
        )
    except Exception as e:
        logger.warning(f"Hinglish conversion failed: {e}")
        return text


# ─────────────────────────────────────────────────────────────────────────────
"""
app/services/learning_service.py — Guided Learning Plan generation
"""
import json
from dataclasses import dataclass, field
from typing import List

LEARNING_SYSTEM = """\
You are a senior software architect creating a guided learning curriculum for a developer
who wants to deeply understand a codebase. Generate structured, progressive steps.
Always return valid JSON only, no markdown code fences, no preamble.
"""

LEARNING_PROMPT = """\
Create a guided learning plan for this codebase.

Project: {project_name}
Framework: {framework} ({language})
Summary: {summary}
Architecture: {architecture}
Entry Points: {entry_points}
File Ranking (most important first):
{file_ranking}

Return JSON with this exact structure:
{{
  "prerequisite_knowledge": ["concept1", "concept2"],
  "estimated_total_time": "X hours",
  "steps": [
    {{
      "step": 1,
      "title": "Step title",
      "description": "What the learner will understand after this step",
      "files_to_read": ["file1.py", "file2.py"],
      "key_concepts": ["concept1", "concept2"],
      "estimated_time": "20 minutes"
    }}
  ]
}}

Generate 6-8 progressive steps from foundations to advanced features.
"""


async def generate_learning_plan(analysis: dict) -> dict:
    """Generate a step-by-step learning curriculum for a repository."""
    file_ranking_text = "\n".join(
        f"  {i+1}. {f['file']} — {f['purpose']}"
        for i, f in enumerate(analysis.get("file_ranking", [])[:10])
    )

    raw = await llm.complete(
        system=LEARNING_SYSTEM,
        messages=[{"role": "user", "content": LEARNING_PROMPT.format(
            project_name=analysis.get("project_name", "Unknown"),
            framework=analysis.get("framework", "Unknown"),
            language=analysis.get("language", "Unknown"),
            summary=analysis.get("summary", ""),
            architecture=analysis.get("architecture_overview", ""),
            entry_points=", ".join(analysis.get("entry_points", [])),
            file_ranking=file_ranking_text,
        )}],
        temperature=0.3,
        max_tokens=2000,
    )

    try:
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except json.JSONDecodeError as e:
        logger.warning(f"Learning plan JSON parse failed: {e}")
        return {"steps": [], "prerequisite_knowledge": [], "estimated_total_time": "Unknown"}


# ─────────────────────────────────────────────────────────────────────────────
"""
app/services/flow_service.py — System flow diagram generation
"""

FLOW_SYSTEM = """\
You are an expert system architect. Generate text-based flow diagrams showing
how data and requests move through a software system.
Always return valid JSON only, no markdown code fences.
"""

FLOW_PROMPT = """\
Analyze this codebase and generate 3-4 key system flow diagrams.

Project: {project_name}
Framework: {framework}
Architecture: {architecture}
Data Flow Description: {data_flow}
Key Files: {key_files}

Return JSON:
{{
  "flows": [
    {{
      "name": "Flow Name",
      "description": "What this flow represents",
      "text_representation": "User Request\\n    ↓\\nRouter Layer\\n    ↓\\nService Layer\\n    ↓\\nDatabase\\n    ↓\\nResponse",
      "nodes": [
        {{"id": "n1", "label": "User Request", "type": "entry", "description": "HTTP request from client"}},
        {{"id": "n2", "label": "Router", "type": "process", "description": "FastAPI route handler"}}
      ],
      "edges": [
        {{"from_id": "n1", "to_id": "n2", "label": "HTTP POST"}}
      ]
    }}
  ]
}}

Node types: entry | process | data | output | external | error
Generate flows for: main request flow, auth flow, data persistence flow, async/background jobs (if applicable).
"""


async def generate_flows(analysis: dict) -> dict:
    """Generate system flow diagrams from analysis data."""
    key_files = "\n".join(
        f"  - {f['file']}: {f['purpose']}"
        for f in analysis.get("file_ranking", [])[:8]
    )

    raw = await llm.complete(
        system=FLOW_SYSTEM,
        messages=[{"role": "user", "content": FLOW_PROMPT.format(
            project_name=analysis.get("project_name", "Unknown"),
            framework=analysis.get("framework", "Unknown"),
            architecture=analysis.get("architecture_overview", ""),
            data_flow=analysis.get("data_flow", ""),
            key_files=key_files,
        )}],
        temperature=0.2,
        max_tokens=2500,
    )

    try:
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except json.JSONDecodeError as e:
        logger.warning(f"Flow JSON parse failed: {e}")
        return {"flows": []}


# ─────────────────────────────────────────────────────────────────────────────
"""
app/services/prototype_service.py — UI Screen detection & React code generation
"""

PROTOTYPE_SYSTEM = """\
You are a frontend architect analyzing a backend codebase to infer UI screens.
Generate production-quality React placeholder components.
Return valid JSON only, no markdown.
"""

PROTOTYPE_PROMPT = """\
Analyze this codebase and detect possible frontend UI screens.

Project: {project_name}
Framework: {framework}
API Routes / Endpoints detected: {entry_points}
Summary: {summary}
File structure preview:
{file_listing}

For each detected screen, generate a complete React functional component (JSX) 
that acts as a placeholder with:
- Proper Tailwind CSS styling (dark theme)
- Meaningful UI elements (forms, tables, cards) relevant to the screen's purpose
- Navigation links to related screens

Return JSON:
{{
  "framework_detected": "React",
  "navigation_structure": "Single-page app with sidebar navigation",
  "screens": [
    {{
      "id": "screen_id",
      "name": "Screen Name",
      "route": "/route",
      "description": "What this screen does",
      "components": ["Component1", "Component2"],
      "connected_to": ["other_screen_id"],
      "jsx_code": "export default function ScreenName() {{ return <div>...</div>; }}"
    }}
  ]
}}

Generate 4-6 screens. Make JSX realistic and well-styled with Tailwind.
"""


async def generate_prototype(analysis: dict, file_paths: list) -> dict:
    """Detect UI screens and generate React placeholder components."""
    file_listing = "\n".join(f"  {p}" for p in file_paths[:50])

    raw = await llm.complete(
        system=PROTOTYPE_SYSTEM,
        messages=[{"role": "user", "content": PROTOTYPE_PROMPT.format(
            project_name=analysis.get("project_name", "Unknown"),
            framework=analysis.get("framework", "Unknown"),
            entry_points=", ".join(analysis.get("entry_points", [])),
            summary=analysis.get("summary", ""),
            file_listing=file_listing,
        )}],
        temperature=0.4,
        max_tokens=3000,
    )

    try:
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except json.JSONDecodeError as e:
        logger.warning(f"Prototype JSON parse failed: {e}")
        return {"screens": [], "framework_detected": "React", "navigation_structure": ""}
