import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Cpu,
  MessageSquare,
  Mic,
  MicOff,
  Plus,
  Send,
  Square,
  Terminal,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AIProviderInfo, Conversation, Message } from "../../types";
import {
  createConversation,
  deleteConversation,
  fetchProviders,
  getConversation,
  listConversations,
  streamMessage,
  synthesizeSpeech,
  transcribeAudio,
} from "../../services/api";

export const ChatView: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("mock");
  const [selectedModel, setSelectedModel] = useState<string>("");

  // Voice STT & TTS states (Phase 4)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeAudioMsgId, setActiveAudioMsgId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [convList, provList] = await Promise.all([
        listConversations(),
        fetchProviders().catch(() => []),
      ]);

      setConversations(convList);
      setProviders(provList);

      if (provList.length > 0) {
        // Prefer mock or first available provider
        const available = provList.find((p) => p.available);
        if (available) {
          setSelectedProvider(available.name);
          if (available.models.length > 0) {
            setSelectedModel(available.models[0]);
          }
        }
      }

      if (convList.length > 0 && !activeConvId) {
        selectConversation(convList[0].id);
      }
    } catch (err) {
      console.error("Failed to load initial chat data:", err);
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
      const newConv = await createConversation(`Session ${conversations.length + 1}`, selectedProvider);
      setConversations([newConv, ...conversations]);
      setActiveConvId(newConv.id);
      setActiveMessages([]);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          setActiveConvId(null);
          setActiveMessages([]);
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setSending(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || sending) return;

    let targetConvId = activeConvId;
    if (!targetConvId) {
      try {
        const newConv = await createConversation("Primary Session", selectedProvider);
        setConversations([newConv, ...conversations]);
        targetConvId = newConv.id;
        setActiveConvId(newConv.id);
      } catch (err) {
        console.error("Failed to initialize conversation:", err);
        return;
      }
    }

    const optimisticUserMsg: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    const tempAssistantId = "asst-" + Date.now();
    const initialAssistantMsg: Message = {
      id: tempAssistantId,
      role: "assistant",
      content: "",
      model: selectedProvider,
      created_at: new Date().toISOString(),
    };

    setActiveMessages((prev) => [...prev, optimisticUserMsg, initialAssistantMsg]);
    setInputText("");
    setSending(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await streamMessage(
        targetConvId,
        text,
        {
          provider: selectedProvider,
          model: selectedModel || undefined,
          signal: controller.signal,
        },
        {
          onStart: (meta) => {
            setActiveMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId ? { ...m, model: meta.model } : m
              )
            );
          },
          onToken: (token) => {
            setActiveMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId ? { ...m, content: m.content + token } : m
              )
            );
          },
          onDone: (meta) => {
            setActiveMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId ? { ...m, id: meta.message_id, model: meta.model } : m
              )
            );
          },
          onError: (error) => {
            setActiveMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId
                  ? { ...m, content: m.content + `\n[Stream Error: ${error}]` }
                  : m
              )
            );
          },
        }
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Generation stopped by user");
      } else {
        console.error("Stream failed:", err);
        setActiveMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantId
              ? {
                  ...m,
                  content:
                    m.content ||
                    "Error communicating with AI service. Check provider status in Settings.",
                }
              : m
          )
        );
      }
    } finally {
      setSending(false);
      abortControllerRef.current = null;
    }
  };

  // Voice Recording & Transcription (STT - Phase 4)
  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      try {
        const result = await transcribeAudio(undefined, undefined, "mock");
        if (result.text) {
          setInputText((prev) => (prev ? `${prev} ${result.text}` : result.text));
        }
      } catch (err) {
        console.error("Speech transcription failed:", err);
      }
    } else {
      setIsRecording(true);
    }
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
  };

  // Text-to-Speech Read Aloud (TTS - Phase 4)
  const handleReadAloud = async (msgId: string, text: string) => {
    if (activeAudioMsgId === msgId) {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
        setAudioElement(null);
      }
      setActiveAudioMsgId(null);
      return;
    }

    try {
      if (audioElement) {
        audioElement.pause();
      }

      setActiveAudioMsgId(msgId);
      const cleanText = text.replace(/\[Stream Error:.*?\]/g, "").trim();
      const wavBlob = await synthesizeSpeech(cleanText || "Message content is empty", undefined, 1.0, "mock");
      const audioUrl = URL.createObjectURL(wavBlob);
      const audio = new Audio(audioUrl);
      setAudioElement(audio);

      audio.onended = () => {
        setActiveAudioMsgId(null);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setActiveAudioMsgId(null);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play().catch(() => {
        setTimeout(() => setActiveAudioMsgId(null), 1500);
      });
    } catch (err) {
      console.error("Read aloud synthesis failed:", err);
      setActiveAudioMsgId(null);
    }
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provName = e.target.value;
    setSelectedProvider(provName);
    const found = providers.find((p) => p.name === provName);
    if (found && found.models.length > 0) {
      setSelectedModel(found.models[0]);
    } else {
      setSelectedModel("");
    }
  };

  const promptChips = [
    "Run system diagnostics and verify database",
    "Stream real-time response via active AI router",
    "Check local model availability on 127.0.0.1",
    "What are the configured security policies?",
  ];

  const currentProviderInfo = providers.find((p) => p.name === selectedProvider);

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
            <div
              key={c.id}
              className={`conversation-item ${c.id === activeConvId ? "active" : ""}`}
              onClick={() => selectConversation(c.id)}
            >
              <MessageSquare size={16} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{c.title}</span>
              <button
                className="conv-delete-btn"
                title="Delete session"
                onClick={(e) => handleDeleteConversation(e, c.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
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
        {/* Chat Header Toolbar */}
        <div className="chat-header-toolbar">
          <div className="provider-select-group">
            <Cpu size={16} style={{ color: "var(--cyan-bright)" }} />
            <select
              className="provider-select"
              value={selectedProvider}
              onChange={handleProviderChange}
            >
              {providers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name.toUpperCase()} {p.available ? "(Available)" : "(Offline)"}
                </option>
              ))}
              {providers.length === 0 && (
                <option value="mock">MOCK (Offline Mode)</option>
              )}
            </select>

            {currentProviderInfo && currentProviderInfo.models.length > 0 && (
              <select
                className="provider-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {currentProviderInfo.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "var(--text-faint)" }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: currentProviderInfo?.available ? "var(--emerald-success)" : "#fbbf24",
              display: "inline-block",
            }} />
            <span>{currentProviderInfo?.available ? "Ready" : "Fallback Enabled"}</span>
          </div>
        </div>

        <div className="messages-scroll">
          {activeMessages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Bot size={32} />
              </div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px", color: "var(--text-main)" }}>
                JARVIS AI Assistant
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", maxWidth: "480px" }}>
                Phase 2 AI Provider Routing is active. Real-time streaming and local-first fallback are fully functional.
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
                    <span className={`model-badge ${msg.model?.includes("fallback") ? "fallback" : ""}`}>
                      {msg.model || "JARVIS"}
                    </span>
                  </div>
                )}
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {msg.content}
                  {sending && msg.role === "assistant" && msg.content === "" && (
                    <span style={{ color: "var(--text-faint)", fontStyle: "italic" }}>
                      Thinking...
                    </span>
                  )}
                  {sending && msg.id.startsWith("asst-") && (
                    <span className="streaming-cursor" />
                  )}
                </div>

                {/* Read Aloud TTS Button (Phase 4) */}
                {msg.role === "assistant" && msg.content && (
                  <button
                    type="button"
                    className={`read-aloud-btn ${activeAudioMsgId === msg.id ? "playing" : ""}`}
                    title={activeAudioMsgId === msg.id ? "Stop playback" : "Read aloud (TTS)"}
                    onClick={() => handleReadAloud(msg.id, msg.content)}
                  >
                    {activeAudioMsgId === msg.id ? (
                      <>
                        <VolumeX size={13} />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={13} />
                        <span>Read Aloud</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Recording active indicator strip (Phase 4) */}
        {isRecording && (
          <div className="recording-indicator-strip">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#f43f5e",
                  display: "inline-block",
                }}
              />
              <span>Recording microphone input... Click Mic to transcribe.</span>
            </div>
            <button
              type="button"
              onClick={handleCancelRecording}
              style={{
                background: "transparent",
                border: "none",
                color: "#fb7185",
                cursor: "pointer",
                fontSize: "0.75rem",
              }}
            >
              Cancel
            </button>
          </div>
        )}

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
          />

          {/* Voice Input Button (Phase 4) */}
          <button
            type="button"
            className={`voice-record-btn ${isRecording ? "recording" : ""}`}
            title={isRecording ? "Stop recording & transcribe" : "Voice Input (STT)"}
            onClick={handleToggleRecording}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {sending ? (
            <button
              className="stop-btn"
              type="button"
              title="Stop Generation"
              onClick={handleStopStreaming}
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button className="send-btn" type="submit" disabled={!inputText.trim()}>
              <Send size={18} />
            </button>
          )}
        </form>
      </main>
    </div>
  );
};
