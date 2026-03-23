"""
app/services/repo_service.py — Git clone + file tree parsing.
Produces a RepoSnapshot with file contents, language detection, and framework detection.
Now stores all files in Supabase DB for persistence.
"""

import asyncio
import hashlib
import logging
import os
import shutil
import stat
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.models import RepositoryFile

logger = logging.getLogger(__name__)

LANGUAGE_MAP = {
    ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
    ".jsx": "JavaScript", ".tsx": "TypeScript", ".go": "Go",
    ".java": "Java", ".rs": "Rust", ".rb": "Ruby", ".php": "PHP",
    ".cs": "C#", ".cpp": "C++", ".c": "C", ".html": "HTML",
    ".css": "CSS", ".scss": "CSS", ".md": "Markdown", ".yml": "YAML",
    ".yaml": "YAML", ".json": "JSON", ".toml": "TOML",
}

FRAMEWORK_SIGNATURES = {
    "FastAPI":    ["fastapi", "from fastapi"],
    "Django":     ["django", "from django"],
    "Flask":      ["from flask", "import flask"],
    "Next.js":    ["next/app", "next/router", "next.config"],
    "React":      ["react-dom", "from 'react'"],
    "Vue":        ["vue.config", "from 'vue'"],
    "Express":    ["express()", "require('express')"],
    "NestJS":     ["@nestjs", "@Module"],
    "Spring":     ["@SpringBootApplication", "org.springframework"],
}


@dataclass
class FileNode:
    path:     str
    content:  str
    language: str
    lines:    int


@dataclass
class RepoSnapshot:
    repo_id:             str
    repo_url:            str
    files:               List[FileNode] = field(default_factory=list)
    directory_tree:      str = ""
    detected_frameworks: List[str] = field(default_factory=list)
    entry_points:        List[str] = field(default_factory=list)
    package_files:       Dict[str, str] = field(default_factory=dict)


class RepoService:
    """Clone a GitHub repo, produce a RepoSnapshot, and store files in DB."""

    async def ingest(self, repo_url: str, db: Optional[AsyncSession] = None) -> RepoSnapshot:
        repo_id   = self._make_repo_id(repo_url)
        clone_dir = Path(settings.REPO_CLONE_DIR) / repo_id

        # Clone in a thread to avoid blocking the event loop
        await asyncio.get_event_loop().run_in_executor(
            None, self._clone, repo_url, clone_dir
        )

        snapshot = RepoSnapshot(repo_id=repo_id, repo_url=repo_url)
        self._walk(clone_dir, snapshot)
        snapshot.directory_tree      = self._build_tree(clone_dir)
        snapshot.detected_frameworks = self._detect_frameworks(snapshot)
        snapshot.entry_points        = self._detect_entry_points(snapshot)

        # Store files in database for persistence
        if db:
            await self.store_files_in_db(repo_id, snapshot.files, db)
            logger.info(f"✅ Stored {len(snapshot.files)} files in database for repo {repo_id}")

        return snapshot

    async def store_files_in_db(self, repo_id: str, files: List[FileNode], db: AsyncSession) -> None:
        """Store all repository files in Supabase for persistent access."""
        try:
            # Delete old files if re-uploading same repo
            from sqlalchemy import delete
            await db.execute(
                delete(RepositoryFile).where(RepositoryFile.repo_id == repo_id)
            )
            await db.flush()
            
            # Insert new files in batches
            file_records = []
            for file_node in files:
                file_records.append(RepositoryFile(
                    repo_id=repo_id,
                    file_path=file_node.path,
                    content=file_node.content,
                    language=file_node.language,
                    lines=file_node.lines,
                    size_bytes=len(file_node.content.encode('utf-8'))
                ))
            
            db.add_all(file_records)
            await db.commit()
            logger.info(f"✅ Stored {len(file_records)} files in DB for repo {repo_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to store files in DB: {e}")
            logger.exception(e)  # Full traceback for debugging
            await db.rollback()
            raise  # Re-raise to see the error in API response
    
    async def get_files_from_db(self, repo_id: str, db: AsyncSession, 
                                file_pattern: Optional[str] = None) -> List[Dict[str, str]]:
        """Retrieve files from database (optionally filtered by pattern)."""
        try:
            query = select(RepositoryFile).where(RepositoryFile.repo_id == repo_id)
            
            if file_pattern:
                query = query.where(RepositoryFile.file_path.like(f"%{file_pattern}%"))
            
            result = await db.execute(query)
            files = result.scalars().all()
            
            return [
                {
                    "path": f.file_path,
                    "content": f.content,
                    "language": f.language,
                    "lines": f.lines
                }
                for f in files
            ]
        except Exception as e:
            logger.error(f"Failed to retrieve files from DB: {e}")
            return []

    # ── Private ──────────────────────────────────────────────────────────────

    def _make_repo_id(self, url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()[:8]

    def _remove_readonly(self, func, path, excinfo):
        """Handle read-only files on Windows during rmtree."""
        os.chmod(path, stat.S_IWRITE)
        func(path)

    def _safe_rmtree(self, path: Path) -> None:
        """Safely remove directory tree, handling Windows permission issues."""
        if not path.exists():
            return
        
        try:
            # First attempt: normal removal
            shutil.rmtree(path)
        except PermissionError:
            try:
                # Second attempt: handle read-only files (Windows)
                shutil.rmtree(path, onerror=self._remove_readonly)
            except Exception as e:
                # Last resort: try to rename and delete
                try:
                    import tempfile
                    temp_dir = Path(tempfile.gettempdir()) / f"devmind_cleanup_{os.getpid()}"
                    path.rename(temp_dir)
                    shutil.rmtree(temp_dir, onerror=self._remove_readonly)
                except Exception:
                    logger.warning(f"Could not fully remove {path}: {e}. Proceeding anyway.")

    def _clone(self, url: str, dest: Path) -> None:
        self._safe_rmtree(dest)
        dest.mkdir(parents=True, exist_ok=True)
        try:
            import git
            git.Repo.clone_from(url, str(dest), depth=1)
        except ImportError:
            raise RuntimeError("GitPython not installed. Run: pip install gitpython")

    def _walk(self, root: Path, snapshot: RepoSnapshot) -> None:
        for dirpath, dirnames, filenames in os.walk(root):
            # Skip ignored directories in-place
            dirnames[:] = [
                d for d in dirnames
                if d not in settings.IGNORED_DIRS and not d.startswith(".")
            ]

            for fname in filenames:
                fpath = Path(dirpath) / fname
                ext   = fpath.suffix.lower()

                if ext in settings.IGNORED_EXTENSIONS:
                    continue
                if fpath.stat().st_size > settings.MAX_FILE_SIZE_KB * 1024:
                    continue

                try:
                    content = fpath.read_text(encoding="utf-8", errors="replace")
                except Exception:
                    continue

                rel = str(fpath.relative_to(root))
                lang = LANGUAGE_MAP.get(ext, "Text")

                snapshot.files.append(
                    FileNode(path=rel, content=content, language=lang, lines=len(content.splitlines()))
                )

                # Save package manifests for summary prompts
                if fname in ("package.json", "requirements.txt", "Cargo.toml", "go.mod", "pom.xml"):
                    snapshot.package_files[fname] = content[:2000]

    def _build_tree(self, root: Path, max_lines: int = 80) -> str:
        lines, count = [], [0]

        def recurse(path: Path, prefix: str):
            if count[0] >= max_lines:
                return
            try:
                entries = sorted(path.iterdir(), key=lambda p: (p.is_file(), p.name))
            except PermissionError:
                return
            for i, entry in enumerate(entries):
                if entry.name in settings.IGNORED_DIRS or entry.name.startswith("."):
                    continue
                connector = "└── " if i == len(entries) - 1 else "├── "
                lines.append(prefix + connector + entry.name)
                count[0] += 1
                if entry.is_dir() and count[0] < max_lines:
                    ext_prefix = "    " if i == len(entries) - 1 else "│   "
                    recurse(entry, prefix + ext_prefix)

        recurse(root, "")
        return "\n".join(lines)

    def _detect_frameworks(self, snapshot: RepoSnapshot) -> List[str]:
        all_content = " ".join(f.content for f in snapshot.files)
        detected = []
        for fw, signals in FRAMEWORK_SIGNATURES.items():
            if any(s in all_content for s in signals):
                detected.append(fw)
        return detected[:5]

    def _detect_entry_points(self, snapshot: RepoSnapshot) -> List[str]:
        candidates = ["main.py", "app.py", "server.py", "index.js", "index.ts", "main.go", "app.js"]
        return [f.path for f in snapshot.files if os.path.basename(f.path) in candidates][:5]
