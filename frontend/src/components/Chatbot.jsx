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
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#168BFF] text-white shadow-xl shadow-[#168BFF]/25 hover:bg-[#1278e0] transition-base flex items-center justify-center border border-[#168BFF]/40"
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
              ? "w-full h-[550px] flex flex-col overflow-hidden shadow-2xl rounded-2xl border border-[rgba(22,139,255,0.15)]"
              : "fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[500px] max-h-[70vh] flex flex-col overflow-hidden shadow-2xl rounded-2xl border border-[rgba(22,139,255,0.15)]"
          }
          style={{
            background: "#070910",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              background: "#0C1C35",
              borderBottom: "1px solid rgba(22,139,255,0.15)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#168BFF]" />
              <div>
                <div className="font-semibold text-sm text-[#EFF7FF]">{title}</div>
                <div className="text-[12px] text-[#94A8C2]">Powered by Groq AI</div>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-base text-[#94A8C2] hover:text-[#EFF7FF]"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-3"
            style={{
              background: "#070910",
              padding: "16px",
            }}
          >
            {messages.length === 0 && (
              <div className="text-center py-6">
                <Sparkles className="w-8 h-8 text-[#168BFF] mx-auto mb-3" />
                <p className="text-xs text-[#94A8C2] mb-4 leading-relaxed">
                  I'm Vridhi Assistant. Ask me about credit scores, risk factors, or loan recommendations.
                </p>
                <div className="space-y-1.5">
                  {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="block w-full text-left text-xs text-[#EFF7FF] bg-[#0C1C35] hover:bg-[#168BFF]/15 border border-[rgba(22,139,255,0.15)] rounded-lg px-3 py-2 transition-base"
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
                          background: "#168BFF",
                          color: "#EFF7FF",
                          borderRadius: "12px 12px 2px 12px",
                        }
                      : {
                          background: "#0C1C35",
                          border: "1px solid rgba(22,139,255,0.12)",
                          color: "#EFF7FF",
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
                    background: "#0C1C35",
                    border: "1px solid rgba(22,139,255,0.12)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                  }}
                  className="flex items-center gap-1.5"
                >
                  <span className="typing-dot w-2 h-2 rounded-full bg-[#168BFF] animate-pulse" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-[#168BFF] animate-pulse delay-150" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-[#168BFF] animate-pulse delay-300" />
                </div>
              </div>
            )}

            {error && !loading && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#f87171",
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
            className="p-3 flex gap-2"
            style={{
              background: "#0C1C35",
              borderTop: "1px solid rgba(22,139,255,0.12)",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about credit risk..."
              className="flex-1 text-sm px-3 py-2 focus:outline-none transition-base"
              style={{
                background: "#070910",
                border: "1px solid rgba(22,139,255,0.2)",
                color: "#EFF7FF",
                borderRadius: "10px",
              }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="px-3 py-2 disabled:opacity-40 transition-base flex items-center justify-center"
              style={{
                background: "#168BFF",
                color: "white",
                borderRadius: "10px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1278e0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#168BFF")}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
