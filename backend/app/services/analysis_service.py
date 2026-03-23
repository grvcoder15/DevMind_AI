"""
app/services/analysis_service.py — AI-powered codebase analysis.

Parallel LLM calls:
  1. Project summary + framework + language + dependencies
  2. Architecture overview
  3. Data flow description
  4. File importance ranking (heuristic pre-sort + LLM scoring)
"""

import asyncio
import logging
from typing import Dict, List

from app.core.config import settings
from app.services.ai_service import llm
from app.services.repo_service import RepoSnapshot

logger = logging.getLogger(__name__)

# ─── System prompt ────────────────────────────────────────────────────────────

SYSTEM = """\
You are an expert software architect and senior code reviewer.
Analyze codebases with precision. Be concise but technically accurate.
Always reference specific files, functions, and patterns you observe.
"""

# ─── Prompts ──────────────────────────────────────────────────────────────────

PROMPT_SUMMARY = """\
Analyze this codebase snapshot and provide:

1. A 2-3 sentence PROJECT SUMMARY explaining what the project does
2. The PRIMARY FRAMEWORK (one word, e.g., "FastAPI", "Next.js", "Django")
3. The PRIMARY LANGUAGE (one word, e.g., "Python", "TypeScript")
4. KEY DEPENDENCIES (comma-separated list of important packages)

Repository: {repo_url}
Detected frameworks: {frameworks}
Directory tree:
{tree}

Top files by size:
{top_files}

Package manifest content:
{packages}

Respond ONLY in this exact format:
SUMMARY: <your 2-3 sentence summary>
FRAMEWORK: <primary framework>
LANGUAGE: <primary language>
DEPENDENCIES: <dep1, dep2, dep3, ...>
"""

PROMPT_ARCHITECTURE = """\
Given this codebase, describe the ARCHITECTURE in 3-4 sentences.
Focus on: design patterns, layer separation, key components, scalability choices.

Project: {project_name} ({framework})
Directory structure:
{tree}

Entry points: {entry_points}

Key source files:
{source_preview}
"""

PROMPT_DATA_FLOW = """\
Explain the DATA FLOW in this {framework} application in 2-3 sentences.
Start from an incoming HTTP request and trace it to the final response/database operation.
Mention specific files, middleware, and patterns you detect.

Directory structure:
{tree}

Source preview:
{source_preview}
"""

PROMPT_FILE_RANKING = """\
Rank these files by ARCHITECTURAL IMPORTANCE (0-100 score).
Consider: how central they are to the app, number of dependents, business logic density.

Files:
{file_list}

For each file respond with exactly:
FILE: <path> | SCORE: <0-100> | PURPOSE: <10-word max description>
"""


# ─── Service ─────────────────────────────────────────────────────────────────

class AnalysisService:
    """Orchestrates multi-step AI analysis of a parsed repository."""

    async def analyze(self, snapshot: RepoSnapshot) -> dict:
        source_preview = self._build_source_preview(snapshot)

        # Step 1: Summary (needed by downstream steps)
        summary_data = await self._get_summary(snapshot, source_preview)
        project_name = self._infer_project_name(snapshot)

        # Steps 2 & 3: Architecture + Data Flow (concurrent)
        arch_task = self._get_architecture(snapshot, summary_data, source_preview, project_name)
        flow_task = self._get_data_flow(snapshot, summary_data, source_preview)
        architecture, data_flow = await asyncio.gather(arch_task, flow_task)

        # Step 4: File ranking
        file_ranking = await self._rank_files(snapshot)

        return {
            "repo_id":              snapshot.repo_id,
            "project_name":         project_name,
            "language":             summary_data.get("language", "Unknown"),
            "framework":            summary_data.get("framework") or (snapshot.detected_frameworks[0] if snapshot.detected_frameworks else "Unknown"),
            "total_files":          len(snapshot.files),
            "total_lines":          sum(f.lines for f in snapshot.files),
            "dependencies":         summary_data.get("dependencies", []),
            "entry_points":         snapshot.entry_points,
            "summary":              summary_data.get("summary", ""),
            "architecture_overview": architecture,
            "data_flow":            data_flow,
            "file_ranking":         [{"file": r["file"], "importance": r["importance"], "purpose": r["purpose"]} for r in file_ranking],
        }

    # ── Private ──────────────────────────────────────────────────────────────

    async def _get_summary(self, snapshot: RepoSnapshot, source_preview: str) -> Dict:
        packages = "\n".join(
            f"--- {name} ---\n{content[:800]}"
            for name, content in list(snapshot.package_files.items())[:3]
        )
        top_files = "\n".join(
            f.path for f in sorted(snapshot.files, key=lambda f: -f.lines)[:20]
        )
        raw = await llm.complete(
            system=SYSTEM,
            messages=[{"role": "user", "content": PROMPT_SUMMARY.format(
                repo_url=snapshot.repo_url,
                frameworks=", ".join(snapshot.detected_frameworks) or "unknown",
                tree=snapshot.directory_tree[:2000],
                top_files=top_files,
                packages=packages or "N/A",
            )}],
        )

        result: Dict = {}
        for line in raw.splitlines():
            if line.startswith("SUMMARY:"):
                result["summary"] = line.replace("SUMMARY:", "").strip()
            elif line.startswith("FRAMEWORK:"):
                result["framework"] = line.replace("FRAMEWORK:", "").strip()
            elif line.startswith("LANGUAGE:"):
                result["language"] = line.replace("LANGUAGE:", "").strip()
            elif line.startswith("DEPENDENCIES:"):
                deps_raw = line.replace("DEPENDENCIES:", "").strip()
                result["dependencies"] = [d.strip() for d in deps_raw.split(",") if d.strip()]
        return result

    async def _get_architecture(self, snapshot, summary, preview, project_name) -> str:
        return await llm.complete(
            system=SYSTEM,
            messages=[{"role": "user", "content": PROMPT_ARCHITECTURE.format(
                project_name=project_name,
                framework=summary.get("framework", "unknown"),
                tree=snapshot.directory_tree[:2000],
                entry_points=", ".join(snapshot.entry_points),
                source_preview=preview,
            )}],
        )

    async def _get_data_flow(self, snapshot, summary, preview) -> str:
        return await llm.complete(
            system=SYSTEM,
            messages=[{"role": "user", "content": PROMPT_DATA_FLOW.format(
                framework=summary.get("framework", "unknown"),
                tree=snapshot.directory_tree[:1500],
                source_preview=preview,
            )}],
        )

    async def _rank_files(self, snapshot: RepoSnapshot) -> List[dict]:
        def heuristic(f):
            imports = f.content.count("import ") + f.content.count("from ")
            return f.lines * (1 + imports * 0.1)

        top_files = sorted(snapshot.files, key=heuristic, reverse=True)[:30]
        file_list  = "\n".join(
            f"{i+1}. {f.path} ({f.lines} lines, {f.language})"
            for i, f in enumerate(top_files)
        )

        try:
            raw = await llm.complete(
                system=SYSTEM,
                messages=[{"role": "user", "content": PROMPT_FILE_RANKING.format(file_list=file_list)}],
            )
        except Exception as e:
            logger.warning(f"File ranking LLM call failed: {e}")
            return [{"file": f.path, "importance": max(10, 100 - i*5), "purpose": f"Lines: {f.lines}"} for i, f in enumerate(top_files[:15])]

        results = []
        for line in raw.splitlines():
            if line.startswith("FILE:"):
                try:
                    parts   = line.split("|")
                    results.append({
                        "file":       parts[0].replace("FILE:", "").strip(),
                        "importance": int(parts[1].replace("SCORE:", "").strip()),
                        "purpose":    parts[2].replace("PURPOSE:", "").strip(),
                    })
                except (IndexError, ValueError):
                    continue

        return sorted(results, key=lambda r: -r["importance"])[:15]

    def _build_source_preview(self, snapshot: RepoSnapshot, max_chars: int = 4000) -> str:
        preview_parts, total = [], 0
        for f in snapshot.files:
            if f.language in ("Python", "TypeScript", "JavaScript", "Go", "Java"):
                chunk = f"# {f.path}\n{f.content[:600]}\n"
                if total + len(chunk) > max_chars:
                    break
                preview_parts.append(chunk)
                total += len(chunk)
        return "\n".join(preview_parts)

    def _infer_project_name(self, snapshot: RepoSnapshot) -> str:
        try:
            return snapshot.repo_url.rstrip("/").split("/")[-1].replace("-", " ").title()
        except Exception:
            return "Unknown Project"
