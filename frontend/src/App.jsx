import { useEffect, useState } from "react";
import {
  Brain,
  FileUp,
  MessageSquare,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from "lucide-react";

import {
  evaluateAnswer,
  health,
  sendChat,
  uploadDocument,
} from "./api";


function App() {
  const [tab, setTab] = useState("coach");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("Checking local AI...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    health()
      .then((data) => {
        setStatus(
          data.ollama
            ? `Local AI online · ${data.model}`
            : "Ollama is not running"
        );
      })
      .catch(() => setStatus("Backend is not running"));
  }, []);

  async function handleUpload(event) {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;

    setBusy(true);

    try {
      for (const file of selected) {
        const result = await uploadDocument(file);
        setFiles((current) => [
          ...current,
          `${result.name} · ${result.chunks} chunks`,
        ]);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function handleChat(event) {
    event.preventDefault();

    if (!message.trim() || busy) return;

    const currentMessage = message.trim();

    setMessages((current) => [
      ...current,
      { role: "user", content: currentMessage },
    ]);
    setMessage("");
    setBusy(true);

    try {
      const result = await sendChat(currentMessage, tab);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: `Error: ${error.message}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function startInterview() {
    setBusy(true);
    setFeedback("");

    try {
      const result = await sendChat(
        "Start a realistic software engineering interview. Ask me the first question based on my uploaded profile.",
        "interview"
      );
      setQuestion(result.answer);
    } catch (error) {
      setQuestion(`Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleEvaluate() {
    if (!question.trim() || !answer.trim() || busy) return;

    setBusy(true);

    try {
      const result = await evaluateAnswer(question, answer);
      setFeedback(result.feedback);
    } catch (error) {
      setFeedback(`Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Brain size={22} />
          </div>
          <div>
            <h1>Friend Interview Buddy</h1>
            <p>Private AI interview practice</p>
          </div>
        </div>

        <div className="status">
          <span className="status-dot" />
          {status}
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <section className="privacy-card">
            <ShieldCheck size={20} />
            <div>
              <strong>Local-first AI</strong>
              <p>Your documents stay on this machine.</p>
            </div>
          </section>

          <label className="upload-button">
            <FileUp size={18} />
            {busy ? "Working..." : "Upload profile"}
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md"
              onChange={handleUpload}
              disabled={busy}
            />
          </label>

          <div className="file-list">
            <h3>Uploaded context</h3>
            {files.length === 0 ? (
              <p className="muted">Upload a resume, project notes or job description.</p>
            ) : (
              files.map((file) => <div className="file-item" key={file}>{file}</div>)
            )}
          </div>

          <div className="open-card">
            <Sparkles size={18} />
            <strong>Open AI stack</strong>
            <p>Qwen3 + Ollama + local RAG</p>
          </div>
        </aside>

        <section className="workspace">
          <nav className="tabs">
            <button
              className={tab === "coach" ? "active" : ""}
              onClick={() => setTab("coach")}
            >
              <MessageSquare size={17} />
              Coach
            </button>

            <button
              className={tab === "interview" ? "active" : ""}
              onClick={() => setTab("interview")}
            >
              <Mic size={17} />
              Interview
            </button>
          </nav>

          {tab === "coach" ? (
            <div className="chat-panel">
              <div className="hero">
                <div className="hero-icon"><Sparkles /></div>
                <h2>Your private interview coach</h2>
                <p>
                  Upload your friend's preparation material, then ask questions
                  grounded in their actual profile.
                </p>
              </div>

              <div className="messages">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <p>Try:</p>
                    <button
                      onClick={() =>
                        setMessage("Ask me five questions about my strongest project.")
                      }
                    >
                      "Ask me five questions about my strongest project."
                    </button>
                    <button
                      onClick={() =>
                        setMessage("What should I improve before my next interview?")
                      }
                    >
                      "What should I improve before my next interview?"
                    </button>
                  </div>
                ) : (
                  messages.map((item, index) => (
                    <div
                      className={`message ${item.role}`}
                      key={`${item.role}-${index}`}
                    >
                      <div>{item.content}</div>
                      {item.sources?.length > 0 && (
                        <small>Sources: {item.sources.join(", ")}</small>
                      )}
                    </div>
                  ))
                )}
              </div>

              <form className="composer" onSubmit={handleChat}>
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ask your interview coach..."
                />
                <button disabled={busy || !message.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          ) : (
            <div className="interview-panel">
              <div className="interview-header">
                <div>
                  <h2>Mock Interview</h2>
                  <p>One question at a time. No instant answers.</p>
                </div>

                <button className="primary" onClick={startInterview} disabled={busy}>
                  <Mic size={17} />
                  {question ? "New question" : "Start interview"}
                </button>
              </div>

              <div className="question-card">
                <span>INTERVIEWER</span>
                <h3>{question || "Start the interview to receive your first question."}</h3>
              </div>

              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Type the answer your friend would give..."
              />

              <button
                className="primary evaluate"
                onClick={handleEvaluate}
                disabled={busy || !question || !answer.trim()}
              >
                Evaluate my answer
              </button>

              {feedback && (
                <div className="feedback-card">
                  <h3>Interview feedback</h3>
                  <pre>{feedback}</pre>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer>
        <WifiOff size={15} />
        Designed to work locally after the AI models are downloaded.
      </footer>
    </div>
  );
}

export default App;
