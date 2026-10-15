const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  try {
    const resp = await fetch(url, options);
    const data = await resp.json();
    if (!resp.ok) {
      const errMsg = data.detail?.message || data.detail?.error || data.error || `Request failed (${resp.status})`;
      const field = data.detail?.field || null;
      return { error: errMsg, field, status: resp.status, data };
    }
    return { data, error: null };
  } catch (err) {
    if (err.name === "TypeError") {
      return { error: "Cannot connect to the server. Please ensure the backend is running.", data: null };
    }
    return { error: err.message || "An unexpected error occurred", data: null };
  }
}

export const api = {
  async health() {
    return request("/api/health");
  },

  async predict(payload) {
    return request("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async predictBatch(file) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/predict/batch", {
      method: "POST",
      body: formData,
    });
  },

  async downloadSampleCsv() {
    const resp = await fetch(`${API_URL}/api/sample-csv`);
    const blob = await resp.blob();
    return blob;
  },

  async segmentation(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/api/segmentation${query ? "?" + query : ""}`);
  },

  async fairness() {
    return request("/api/fairness");
  },

  async simulate(payload) {
    return request("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async forecast(payload) {
    return request("/api/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async chat(message, history = [], context = {}) {
    return request("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, context }),
    });
  },

  chatStreamUrl() {
    return `${API_URL}/api/chat/stream`;
  },

  getBaseUrl() {
    return API_URL;
  },
};
