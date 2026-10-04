# Friend Interview Buddy

A local-first AI interview coach built for one real friend.

## What makes it open/local?

- Local open-weight Qwen3 model through Ollama.
- Local embedding model through Ollama.
- RAG index stored on the user's machine.
- No OpenAI/Claude/Gemini API key.
- Once the models are downloaded, the core AI workflow can run without internet.

## Architecture

React + Vite -> FastAPI -> RAG index -> Ollama -> Qwen3

## Requirements

- Python 3.10+
- Node.js 18+
- Ollama
- Recommended: 8-16 GB RAM
- Qwen3 4B is the default. If your machine handles it comfortably, change `OLLAMA_MODEL=qwen3:8b`.

## 1. Install Ollama

Install Ollama from https://ollama.com/

Then:

```bash
ollama pull qwen3:4b
ollama pull nomic-embed-text
```

Test:

```bash
ollama run qwen3:4b
```

## 2. Backend

```bash
cd backend
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

```bash
pip install -r requirements.txt
copy .env.example .env
# macOS/Linux: cp .env.example .env

uvicorn app.main:app --reload --port 8000
```

Backend: http://localhost:8000
API docs: http://localhost:8000/docs

## 3. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173.

## 4. Use it

1. Upload your friend's resume, notes, or job description.
2. Ask questions in the Coach tab.
3. Use Interview mode to generate questions.
4. Ask the friend to answer.
5. Use the Evaluate Answer button to get feedback.

## Project structure

```text
friend-interview-buddy/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── models.py
│   │   └── services/
│   │       ├── document_service.py
│   │       ├── ollama_service.py
│   │       └── rag_service.py
│   ├── data/
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Important challenge demo

After setup, disconnect the internet and demonstrate:

- local document upload
- local retrieval
- local Qwen3 response

That is your strongest proof that open/local AI is doing the actual work.
