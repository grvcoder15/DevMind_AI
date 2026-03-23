"""
app/db/vector_store.py — FAISS-based vector store for code chunk retrieval.
One FAISS index per repo_id, stored in-memory (or optionally on disk).
"""

import asyncio
import logging
from typing import List

import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("faiss-cpu not installed. Vector search will use mock mode.")

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class VectorStore:
    """
    Per-repo FAISS index.
    Chunks files into 60-line segments with 15-line overlaps,
    embeds via OpenAI text-embedding-3-small, and builds IndexFlatL2.
    """

    def __init__(self):
        # repo_id → {"index": faiss.Index, "chunks": list[str], "meta": list[dict]}
        self._stores: dict = {}

    # ── Indexing ──────────────────────────────────────────────────────────────

    async def index_repo(self, repo_id: str, files: list) -> None:
        """Chunk all files, embed, and build FAISS index for the repo."""
        chunks, meta = self._chunk_files(files)
        if not chunks:
            logger.warning(f"No chunks to index for {repo_id}")
            return

        embeddings = await self._embed_batch(chunks)
        if embeddings is None:
            # Store chunks for mock search even without embeddings
            self._stores[repo_id] = {"index": None, "chunks": chunks, "meta": meta}
            return

        matrix = np.array(embeddings, dtype="float32")
        if FAISS_AVAILABLE:
            index = faiss.IndexFlatL2(settings.EMBEDDING_DIM)
            index.add(matrix)
        else:
            index = None

        self._stores[repo_id] = {"index": index, "chunks": chunks, "meta": meta}
        logger.info(f"Indexed {len(chunks)} chunks for repo {repo_id}")

    # ── Search ────────────────────────────────────────────────────────────────

    async def search(self, repo_id: str, query: str, top_k: int = 5) -> List[dict]:
        """Return top-k relevant code chunks for the query."""
        store = self._stores.get(repo_id)
        if not store:
            return []

        # Mock mode — return first k chunks
        if store["index"] is None:
            return [
                {"chunk": store["chunks"][i], "file": store["meta"][i].get("file", ""), "score": 0.0}
                for i in range(min(top_k, len(store["chunks"])))
            ]

        query_vec = await self._embed_batch([query])
        if query_vec is None:
            return []

        q = np.array(query_vec, dtype="float32")
        distances, indices = store["index"].search(q, top_k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            results.append({
                "chunk":  store["chunks"][idx],
                "file":   store["meta"][idx].get("file", ""),
                "score":  float(dist),
            })
        return results

    # ── Private helpers ───────────────────────────────────────────────────────

    def _chunk_files(self, files: list):
        """Chunk each file into overlapping line windows."""
        size    = settings.CHUNK_SIZE_LINES
        overlap = settings.CHUNK_OVERLAP_LINES
        chunks, meta = [], []

        for f in files[:settings.MAX_FILES_TO_EMBED]:
            lines = f.content.splitlines()
            start = 0
            while start < len(lines):
                end   = min(start + size, len(lines))
                chunk = "\n".join(lines[start:end])
                if chunk.strip():
                    chunks.append(chunk)
                    meta.append({"file": f.path, "start": start, "end": end})
                start += size - overlap

        return chunks, meta

    async def _embed_batch(self, texts: List[str]):
        """Embed a list of strings using OpenAI. Returns list of float lists or None."""
        if not OPENAI_AVAILABLE or not settings.OPENAI_API_KEY:
            return None
        try:
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            resp = await client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input=texts,
            )
            return [item.embedding for item in resp.data]
        except Exception as e:
            logger.warning(f"Embedding failed: {e}")
            return None
