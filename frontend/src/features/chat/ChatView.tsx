import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  MessageSquare,
  Plus,
  Send,
  Terminal,
} from "lucide-react";
import { Conversation, Message } from "../../types";
import {
  createConversation,
  getConversation,
  listConversations,
  sendMessage,
} from "../../services/api";

export const ChatView: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const list = await listConversations();
      setConversations(list);
      if (list.length > 0 && !activeConvId) {
        selectConversation(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (id: string) => {
    setActiveConvId(id);
    try {
      const conv = await getConversation(id);
      setActiveMessages(conv.messages || []);
    } catch (err) {
      console.error("Failed to load conversation details:", err);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await createConversation(`Session ${conversations.length + 1}`);
      setConversations([newConv, ...conversations]);
      setActiveConvId(newConv.id);
      setActiveMessages([]);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || sending) return;

    let targetConvId = activeConvId;
    if (!targetConvId) {
      try {
        const newConv = await createConversation("Primary Session");
        setConversations([newConv, ...conversations]);
        targetConvId = newConv.id;
        setActiveConvId(newConv.id);
      } catch (err) {
        console.error("Failed to initialize conversation:", err);
        return;
      }
    }

    const optimisticUserMsg: Message = {
      id: "temp-" + Date.now(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setActiveMessages((prev) => [...prev, optimisticUserMsg]);
    setInputText("");
    setSending(true);

    try {
      const assistantMsg = await sendMessage(targetConvId, text);
      setActiveMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMsg: Message = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: "Error communicating with backend service. Please check health status.",
        model: "error",
        created_at: new Date().toISOString(),
      };
      setActiveMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const promptChips = [
    "Run system diagnostics and verify database",
    "Inspect local storage and SQLite WAL pragma",
    "Check AI provider readiness for Phase 2",
    "What are the configured security policies?",
  ];

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <aside className="glass-panel chat-sidebar">
        <button className="new-chat-btn" onClick={handleNewConversation}>
          <Plus size={18} />
          <span>New Session</span>
        </button>

        <div className="conversation-list">
          {conversations.map((c) => (
            <button
              key={c.id}
              className={`conversation-item ${c.id === activeConvId ? "active" : ""}`}
              onClick={() => selectConversation(c.id)}
            >
              <MessageSquare size={16} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
            </button>
          ))}
          {conversations.length === 0 && !loading && (
            <p style={{ color: "var(--text-faint)", fontSize: "0.82rem", textAlign: "center", marginTop: "20px" }}>
              No active sessions yet.
            </p>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="glass-panel chat-main">
        <div className="messages-scroll">
          {activeMessages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Bot size={32} />
              </div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px", color: "var(--text-main)" }}>
                JARVIS Core Assistant
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", maxWidth: "480px" }}>
                Phase 1 Desktop Foundation is active with local SQLite persistence. Send a prompt below to verify live communication.
              </p>

              <div className="prompt-chips">
                {promptChips.map((chip, idx) => (
                  <button
                    key={idx}
                    className="prompt-chip"
                    onClick={() => handleSend(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeMessages.map((msg) => (
              <div key={msg.id} className={`message-bubble ${msg.role}`}>
                {msg.role === "assistant" && (
                  <div>
                    <span className="model-badge">
                      {msg.model || "JARVIS FOUNDATION"}
                    </span>
                  </div>
                )}
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
              </div>
            ))
          )}
          {sending && (
            <div className="message-bubble assistant">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}>
                <span className="pulsing-dot" />
                <span>Processing request...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          className="chat-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Terminal size={18} style={{ color: "var(--text-faint)", marginLeft: "4px" }} />
          <input
            className="chat-input"
            type="text"
            placeholder="Type an instruction or command for JARVIS..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
          />
          <button className="send-btn" type="submit" disabled={!inputText.trim() || sending}>
            <Send size={18} />
          </button>
        </form>
      </main>
    </div>
  );
};
