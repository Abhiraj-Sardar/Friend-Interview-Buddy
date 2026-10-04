from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import FRONTEND_ORIGIN, UPLOAD_DIR, OLLAMA_MODEL
from .models import (
    ChatRequest,
    ChatResponse,
    DocumentResponse,
    InterviewRequest,
)
from .services.document_service import extract_text, chunk_text
from .services.rag_service import add_document, search, context_from_results
from .services.ollama_service import chat, client


app = FastAPI(
    title="Friend Interview Buddy API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


COACH_SYSTEM = """You are Friend Interview Buddy, a private interview coach.

Your job is to help one person prepare for software engineering interviews.

Rules:
- Use the supplied personal context when it is relevant.
- Never invent facts about the person's resume or projects.
- Explain difficult concepts clearly.
- Prefer practical interview advice over generic motivational content.
- If the supplied context does not contain the answer, say so and then give general guidance.
- Ask a useful follow-up question when it would improve practice.
"""

INTERVIEW_SYSTEM = """You are a demanding but supportive software engineering interviewer.

Rules:
- Ask one question at a time.
- Base questions on the candidate's supplied resume/project context when possible.
- Increase difficulty gradually.
- Do not immediately reveal the ideal answer.
- Challenge vague claims with follow-up questions.
- Keep questions realistic for an entry-level software engineer.
"""


@app.get("/health")
def health():
    try:
        client.list()
        ollama_ok = True
    except Exception:
        ollama_ok = False

    return {
        "status": "ok",
        "ollama": ollama_ok,
        "model": OLLAMA_MODEL,
    }


@app.post("/documents", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    allowed = {".pdf", ".docx", ".txt", ".md"}
    suffix = Path(file.filename or "").suffix.lower()

    if suffix not in allowed:
        raise HTTPException(
            status_code=400,
            detail="Supported files: PDF, DOCX, TXT and MD",
        )

    safe_name = Path(file.filename).name
    destination = UPLOAD_DIR / safe_name
    content = await file.read()
    destination.write_bytes(content)

    try:
        text = extract_text(destination)
        chunks = chunk_text(text)

        if not chunks:
            raise ValueError("No readable text was found.")

        count = add_document(safe_name, chunks)

        return DocumentResponse(
            name=safe_name,
            chunks=count,
        )

    except Exception as exc:
        if destination.exists():
            destination.unlink()
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    results = search(request.message)
    context = context_from_results(results)

    if request.mode == "interview":
        system = INTERVIEW_SYSTEM
        user_prompt = f"""Candidate context:

{context or "No candidate documents have been uploaded yet."}

Conversation/task:
{request.message}

Ask or answer only what is necessary for the current interview turn.
"""
    else:
        system = COACH_SYSTEM
        user_prompt = f"""Relevant candidate context:

{context or "No candidate documents have been uploaded yet."}

User request:
{request.message}
"""

    try:
        answer = chat(system, user_prompt)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Could not contact Ollama: {exc}",
        )

    sources = list(dict.fromkeys(item["filename"] for item in results))

    return ChatResponse(
        answer=answer,
        sources=sources,
    )


@app.post("/interview/evaluate")
def evaluate_answer(request: InterviewRequest):
    results = search(request.question)
    context = context_from_results(results)

    prompt = f"""You are evaluating an entry-level software engineering interview answer.

Candidate context:
{context or "No documents available."}

Question:
{request.question}

Candidate answer:
{request.answer}

Evaluate the answer.

Return exactly this structure in plain text:

Score: X/10

What was good:
- ...

What needs improvement:
- ...

Better approach:
- ...

Follow-up question:
...

Be fair. Do not invent experience that is not present.
"""

    try:
        answer = chat(
            "You are an interview evaluator. Be specific, fair and concise.",
            prompt,
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return {"feedback": answer}
