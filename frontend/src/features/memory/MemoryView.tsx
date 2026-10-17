import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Brain,
  Download,
  Edit3,
  Plus,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { MemoryCreateRequest, MemoryItem, MemoryUpdateRequest } from "../../types";
import {
  clearAllMemories,
  createMemory,
  deleteMemory,
  exportMemories,
  listMemories,
  updateMemory,
} from "../../services/api";

export const MemoryView: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Form states
  const [formContent, setFormContent] = useState("");
  const [formType, setFormType] = useState<string>("explicit_fact");
  const [formCategory, setFormCategory] = useState("");
  const [formIsUncertain, setFormIsUncertain] = useState(false);
  const [formConfidence, setFormConfidence] = useState(1.0);
  const [formTags, setFormTags] = useState("");

  useEffect(() => {
    loadMemories();
  }, [searchQuery, activeFilter]);

  const loadMemories = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const params: any = {
        query: searchQuery || undefined,
      };

      if (activeFilter === "uncertain") {
        params.is_uncertain = true;
      } else if (activeFilter !== "all") {
        params.memory_type = activeFilter;
      }

      const res = await listMemories(params);
      setMemories(res.items);
      setTotal(res.total);
    } catch (err: any) {
      console.error("Failed to load memories:", err);
      setErrorMessage(err.message || "Failed to load persistent memories.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormContent("");
    setFormType("explicit_fact");
    setFormCategory("");
    setFormIsUncertain(false);
    setFormConfidence(1.0);
    setFormTags("");
    setErrorMessage(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (mem: MemoryItem) => {
    setEditingMemory(mem);
    setFormContent(mem.content);
    setFormType(mem.memory_type);
    setFormCategory(mem.category || "");
    setFormIsUncertain(mem.is_uncertain);
    setFormConfidence(mem.confidence);
    setFormTags(mem.tags.join(", "));
    setErrorMessage(null);
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;

    const tagsArray = formTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      setErrorMessage(null);
      if (editingMemory) {
        const payload: MemoryUpdateRequest = {
          content: formContent.trim(),
          memory_type: formType,
          category: formCategory.trim() || null,
          is_uncertain: formIsUncertain,
          confidence: formIsUncertain ? formConfidence : 1.0,
          tags: tagsArray,
        };
        const updated = await updateMemory(editingMemory.id, payload);
        setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        setEditingMemory(null);
      } else {
        const payload: MemoryCreateRequest = {
          content: formContent.trim(),
          memory_type: formType,
          category: formCategory.trim() || null,
          is_uncertain: formIsUncertain,
          confidence: formIsUncertain ? formConfidence : 1.0,
          tags: tagsArray,
        };
        const created = await createMemory(payload);
        setMemories([created, ...memories]);
        setTotal((prev) => prev + 1);
        setShowCreateModal(false);
      }
    } catch (err: any) {
      console.error("Failed to save memory:", err);
      setErrorMessage(err.message || "Failed to save memory record.");
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error("Failed to delete memory:", err);
      setErrorMessage(err.message || "Failed to delete memory.");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllMemories();
      setMemories([]);
      setTotal(0);
      setShowClearConfirm(false);
    } catch (err: any) {
      console.error("Failed to clear memories:", err);
      setErrorMessage(err.message || "Failed to clear memories.");
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportMemories();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jarvis_memories_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Failed to export memories:", err);
      setErrorMessage(err.message || "Failed to export memories.");
    }
  };

  const filterTabs = [
    { id: "all", label: "All Context" },
    { id: "explicit_fact", label: "Facts" },
    { id: "preference", label: "Preferences" },
    { id: "project_context", label: "Projects" },
    { id: "reminder", label: "Reminders" },
    { id: "uncertain", label: "Inferred (Uncertain)" },
  ];

  return (
    <div style={{ maxWidth: "980px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <Brain size={26} style={{ color: "var(--cyan-bright)" }} />
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700 }}>
              Persistent Memory & Context
            </h2>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
            Transparent cross-session memory. Confirmed facts and preferences are distinguished from uncertain inferences per PRD Section 11.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleExport}
            className="action-btn-secondary"
            title="Export all memories as JSON backup"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-main)",
              fontSize: "0.84rem",
              cursor: "pointer",
            }}
          >
            <Download size={15} />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleOpenCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              background: "linear-gradient(135deg, var(--cyan-primary), #0284c7)",
              border: "none",
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(6, 182, 212, 0.3)",
            }}
          >
            <Plus size={16} />
            <span>New Memory</span>
          </button>
        </div>
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div
          style={{
            background: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "#fb7185",
            padding: "12px 16px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "20px",
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 14px",
            }}
          >
            <Search size={16} style={{ color: "var(--text-faint)" }} />
            <input
              type="text"
              placeholder="Search memories by keyword, topic, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-main)",
                fontSize: "0.9rem",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "transparent", border: "none", color: "var(--text-faint)", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tab Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.82rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: activeFilter === tab.id ? "1px solid var(--cyan-primary)" : "1px solid var(--border-subtle)",
                background: activeFilter === tab.id ? "rgba(6, 182, 212, 0.15)" : "transparent",
                color: activeFilter === tab.id ? "var(--cyan-bright)" : "var(--text-muted)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {memories.map((mem) => (
          <div
            key={mem.id}
            className="glass-panel"
            style={{
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              position: "relative",
            }}
          >
            {/* Memory Card Top Badges */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: "rgba(6, 182, 212, 0.12)",
                    color: "var(--cyan-bright)",
                    border: "1px solid rgba(6, 182, 212, 0.25)",
                  }}
                >
                  {mem.memory_type.replace("_", " ")}
                </span>

                {mem.is_uncertain ? (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      background: "rgba(245, 158, 11, 0.15)",
                      color: "#fbbf24",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <AlertTriangle size={12} />
                    <span>Inferred • {Math.round(mem.confidence * 100)}% Confidence</span>
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "var(--emerald-success)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <ShieldCheck size={12} />
                    <span>Confirmed Fact</span>
                  </span>
                )}

                {mem.category && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>
                    in {mem.category}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => handleOpenEdit(mem)}
                  title="Edit memory"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-faint)",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "4px",
                    transition: "color 0.15s ease",
                  }}
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => handleDeleteMemory(mem.id)}
                  title="Delete memory"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-faint)",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "4px",
                    transition: "color 0.15s ease",
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Memory Content */}
            <div style={{ fontSize: "0.94rem", color: "var(--text-main)", lineHeight: 1.55 }}>
              {mem.content}
            </div>

            {/* Tags & Timestamp */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                {mem.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      background: "rgba(255, 255, 255, 0.04)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <Tag size={10} />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>

              <span style={{ fontSize: "0.74rem", color: "var(--text-faint)" }}>
                Updated {new Date(mem.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}

        {memories.length === 0 && !loading && (
          <div
            className="glass-panel"
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <Brain size={40} style={{ color: "var(--text-faint)", margin: "0 auto 14px auto" }} />
            <h4 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
              No Memories Found
            </h4>
            <p style={{ fontSize: "0.88rem", maxWidth: "420px", margin: "0 auto 18px auto", color: "var(--text-muted)" }}>
              {searchQuery
                ? `No memories matched your search for "${searchQuery}".`
                : "No persistent memories are stored yet. Add facts, preferences, or project details to help JARVIS remember your context."}
            </p>
            <button
              onClick={handleOpenCreate}
              style={{
                padding: "8px 18px",
                borderRadius: "var(--radius-sm)",
                background: "var(--cyan-primary)",
                border: "none",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Add First Memory
            </button>
          </div>
        )}
      </div>

      {/* Danger Zone: Clear All Memories */}
      {total > 0 && (
        <div
          style={{
            marginTop: "36px",
            padding: "20px",
            border: "1px solid rgba(244, 63, 94, 0.25)",
            background: "rgba(244, 63, 94, 0.04)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h4 style={{ color: "#fb7185", fontWeight: 600, fontSize: "0.95rem", marginBottom: "4px" }}>
              Clear Persistent Memory
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
              Permanently delete all {total} memory records and inferences. This operation cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowClearConfirm(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.4)",
              color: "#fb7185",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear All Memory
          </button>
        </div>
      )}

      {/* Create / Edit Memory Modal */}
      {(showCreateModal || editingMemory) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "540px",
              padding: "28px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-glow)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700 }}>
                {editingMemory ? "Edit Memory Item" : "Create New Memory Item"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingMemory(null);
                }}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMemory} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Memory Content *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Prefers functional programming patterns and typed Python models."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-main)",
                    fontSize: "0.9rem",
                    outline: "none",
                    fontFamily: "var(--font-body)",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Memory Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-main)",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  >
                    <option value="explicit_fact">Explicit Fact</option>
                    <option value="preference">Preference</option>
                    <option value="project_context">Project Context</option>
                    <option value="reminder">Reminder</option>
                    <option value="inferred">Inferred Context</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Category (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. coding, personal"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-main)",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Uncertainty controls */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={formIsUncertain || formType === "inferred"}
                    onChange={(e) => setFormIsUncertain(e.target.checked)}
                  />
                  <span>Mark as Uncertain / Inferred (Honesty Rule PRD 11.1)</span>
                </label>

                {(formIsUncertain || formType === "inferred") && (
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                      <span>Confidence Level</span>
                      <span>{Math.round(formConfidence * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.99"
                      step="0.05"
                      value={formConfidence}
                      onChange={(e) => setFormConfidence(parseFloat(e.target.value))}
                      style={{ width: "100%" }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. typescript, style, architecture"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-main)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ fontSize: "0.76rem", color: "var(--text-faint)" }}>
                Security Policy: Credentials, passwords, API keys, and bearer tokens are automatically rejected.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingMemory(null);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--cyan-primary)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {editingMemory ? "Update Memory" : "Save Memory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear All */}
      {showClearConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "28px",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(244, 63, 94, 0.4)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", color: "#fb7185" }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700 }}>
                Confirm Memory Clearance
              </h3>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "20px" }}>
              Are you sure you want to permanently clear all <strong>{total}</strong> persistent memory items? This action cannot be reversed.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  background: "transparent",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  padding: "8px 18px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(244, 63, 94, 0.8)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
