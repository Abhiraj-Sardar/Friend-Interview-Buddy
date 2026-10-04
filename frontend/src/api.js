const API_URL = "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // Keep the generic error.
    }
    throw new Error(message);
  }

  return response.json();
}

export function health() {
  return request("/health");
}

export function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/documents", {
    method: "POST",
    body: formData,
  });
}

export function sendChat(message, mode = "coach") {
  return request("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, mode }),
  });
}

export function evaluateAnswer(question, answer) {
  return request("/interview/evaluate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, answer }),
  });
}
