import ollama
from ..config import OLLAMA_HOST, OLLAMA_MODEL, OLLAMA_EMBED_MODEL

client = ollama.Client(host=OLLAMA_HOST)


def embed(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    response = client.embed(
        model=OLLAMA_EMBED_MODEL,
        input=texts,
    )
    return response["embeddings"]


def chat(system_prompt: str, user_prompt: str) -> str:
    response = client.chat(
        model=OLLAMA_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        options={
            "temperature": 0.3,
        },
    )
    return response["message"]["content"]
