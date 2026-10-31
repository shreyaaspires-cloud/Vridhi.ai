"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Sparkles, Trash2 } from "lucide-react";
import { api } from "../lib/api";

const SUGGESTED_PROMPTS = [
  "Why is my credit score this high?",
  "How can I improve my score?",
  "What factors are hurting my score?",
  "What happens if my revenue increases by 20%?",
  "Explain my loan recommendation.",
  "Explain my cash-flow forecast.",
  "What does the fairness report mean?",
];

export default function Chatbot({ context = {}, title = "Vridhi Assistant", embedded = false }) {
  const [open, setOpen] = useState(embedded ? true : false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text) => {
      const msgText = text || input.trim();
      if (!msgText || loading) return;

      const userMsg = { role: "user", content: msgText };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        const history = [...messages, userMsg]
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }));

        const result = await api.chat(msgText, history, context);

        if (result.error && !result.data?.reply) {
          setError(result.error);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `I apologize, but I encountered an issue: ${result.error}`,
            },
          ]);
        } else if (result.data?.error && !result.data?.reply) {
          const serverErr = result.data.error;
          setError(serverErr);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `I apologize, but I encountered an issue: ${serverErr}`,
            },
          ]);
        } else {
          const reply = result.data?.reply || "I could not generate a response.";
          setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        }
      } catch (err) {
        setError("Failed to connect to the AI assistant.");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I apologize, but I'm having trouble connecting right now. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, context]
  );

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
      {/* Floating button */}
      {!embedded && (
        <button
          onClick={() => setOpen(!open)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-[var(--border-default)]"
          style={{
            background: "var(--brand-primary)",
            boxShadow: "0 8px 24px rgba(22, 61, 50, 0.28)",
          }}
          aria-label="Open chatbot"
        >
          {open ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={
            embedded
              ? "w-full h-[550px] flex flex-col overflow-hidden shadow-2xl rounded-2xl border border-[var(--border-default)] transition-colors"
              : "fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[500px] max-h-[70vh] flex flex-col overflow-hidden shadow-2xl rounded-2xl border border-[var(--border-default)] transition-colors"
          }
          style={{
            background: "var(--bg-page)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between transition-colors"
            style={{
              background: "var(--surface-primary)",
              borderBottom: "1px solid var(--border-default)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[var(--brand-emerald)]" />
              <div>
                <div className="font-semibold text-sm text-[var(--text-primary)]">{title}</div>
                <div className="text-[12px] text-[var(--text-secondary)]">Powered by Groq AI</div>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-3 transition-colors"
            style={{
              background: "var(--bg-page)",
              padding: "16px",
            }}
          >
            {messages.length === 0 && (
              <div className="text-center py-6">
                <Sparkles className="w-8 h-8 text-[var(--brand-emerald)] mx-auto mb-3" />
                <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
                  I'm Vridhi Assistant. Ask me about credit scores, risk factors, or loan recommendations.
                </p>
                <div className="space-y-1.5">
                  {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="block w-full text-left text-xs text-[var(--text-primary)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)] rounded-lg px-3 py-2 transition-all shadow-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  style={{
                    fontSize: "14px",
                    padding: "10px 14px",
                    ...(msg.role === "user"
                      ? {
                          background: "var(--brand-primary)",
                          color: "var(--btn-primary-text)",
                          borderRadius: "12px 12px 2px 12px",
                          boxShadow: "0 2px 8px rgba(22, 61, 50, 0.15)",
                        }
                      : {
                          background: "var(--surface-card)",
                          border: "1px solid var(--border-default)",
                          color: "var(--text-primary)",
                          borderRadius: "12px 12px 12px 2px",
                        }),
                  }}
                  className="max-w-[85%] leading-relaxed"
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div
                  style={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                  }}
                  className="flex items-center gap-1.5"
                >
                  <span className="typing-dot w-2 h-2 rounded-full bg-[var(--brand-emerald)] animate-pulse" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-[var(--brand-emerald)] animate-pulse delay-150" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-[var(--brand-emerald)] animate-pulse delay-300" />
                </div>
              </div>
            )}

            {error && !loading && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  fontSize: "13px",
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div
            className="p-3 flex gap-2 transition-colors"
            style={{
              background: "var(--surface-primary)",
              borderTop: "1px solid var(--border-default)",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about credit risk..."
              className="flex-1 text-sm px-3 py-2 focus:outline-none transition-all placeholder-[var(--input-placeholder)]"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--input-text)",
                borderRadius: "10px",
              }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="px-3 py-2 disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer shadow-sm hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: "var(--brand-primary)",
                color: "var(--btn-primary-text)",
                borderRadius: "10px",
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
