import json
from pathlib import Path
import numpy as np

from ..config import INDEX_FILE, TOP_K
from .ollama_service import embed


def load_index() -> list[dict]:
    if not INDEX_FILE.exists():
        return []
    try:
        return json.loads(INDEX_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def save_index(items: list[dict]) -> None:
    INDEX_FILE.write_text(
        json.dumps(items, ensure_ascii=False),
        encoding="utf-8",
    )


def add_document(filename: str, chunks: list[str]) -> int:
    vectors = embed(chunks)
    index = load_index()

    for chunk, vector in zip(chunks, vectors):
        index.append(
            {
                "filename": filename,
                "text": chunk,
                "embedding": vector,
            }
        )

    save_index(index)
    return len(chunks)


def cosine_similarity(a: list[float], b: list[float]) -> float:
    a_np = np.asarray(a, dtype=np.float32)
    b_np = np.asarray(b, dtype=np.float32)

    denominator = np.linalg.norm(a_np) * np.linalg.norm(b_np)

    if denominator == 0:
        return 0.0

    return float(np.dot(a_np, b_np) / denominator)


def search(query: str, top_k: int = TOP_K) -> list[dict]:
    index = load_index()

    if not index:
        return []

    query_vector = embed([query])[0]

    scored = [
        {
            **item,
            "score": cosine_similarity(query_vector, item["embedding"]),
        }
        for item in index
    ]

    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[:top_k]


def context_from_results(results: list[dict]) -> str:
    return "\n\n".join(
        f"[Source: {item['filename']}]\n{item['text']}"
        for item in results
    )
