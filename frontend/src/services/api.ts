import { AIProviderInfo, Conversation, HealthResponse, Message } from "../types";

const BASE_URL = "/api/v1";

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Failed to fetch health status: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchProviders(): Promise<AIProviderInfo[]> {
  const res = await fetch(`${BASE_URL}/conversations/providers`);
  if (!res.ok) {
    throw new Error(`Failed to fetch AI providers: ${res.statusText}`);
  }
  return res.json();
}

export async function listConversations(): Promise<Conversation[]> {
  const res = await fetch(`${BASE_URL}/conversations`);
  if (!res.ok) {
    throw new Error(`Failed to list conversations: ${res.statusText}`);
  }
  return res.json();
}

export async function createConversation(title: string = "New Conversation", model?: string): Promise<Conversation> {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, model }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create conversation: ${res.statusText}`);
  }
  return res.json();
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await fetch(`${BASE_URL}/conversations/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch conversation: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/conversations/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete conversation: ${res.statusText}`);
  }
}

export async function sendMessage(conversationId: string, content: string, provider?: string, model?: string): Promise<Message> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, provider, model }),
  });
  if (!res.ok) {
    throw new Error(`Failed to send message: ${res.statusText}`);
  }
  return res.json();
}

export interface StreamHandlers {
  onStart?: (meta: { model: string; message_id: string }) => void;
  onToken?: (token: string) => void;
  onDone?: (meta: { model: string; message_id: string }) => void;
  onError?: (error: string) => void;
}

export async function streamMessage(
  conversationId: string,
  content: string,
  options?: {
    provider?: string;
    model?: string;
    signal?: AbortSignal;
  },
  handlers?: StreamHandlers,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      provider: options?.provider,
      model: options?.model,
    }),
    signal: options?.signal,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Streaming failed: HTTP ${res.status} - ${errorText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const chunk of lines) {
      const trimmed = chunk.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const jsonStr = trimmed.slice(6).trim();
      try {
        const payload = JSON.parse(jsonStr);
        if (payload.event === "start" && handlers?.onStart) {
          handlers.onStart(payload);
        } else if (payload.event === "token" && handlers?.onToken) {
          handlers.onToken(payload.token);
        } else if (payload.event === "done" && handlers?.onDone) {
          handlers.onDone(payload);
        } else if (payload.event === "error" && handlers?.onError) {
          handlers.onError(payload.error);
        }
      } catch {
        // Ignore JSON parse errors in transit
      }
    }
  }
}

// --- Memory API (Phase 3) ---

export interface MemoryFilterParams {
  query?: string;
  memory_type?: string;
  category?: string;
  is_uncertain?: boolean;
  limit?: number;
  offset?: number;
}

export async function listMemories(params?: MemoryFilterParams): Promise<import("../types").MemoryListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.query) queryParams.set("query", params.query);
  if (params?.memory_type) queryParams.set("memory_type", params.memory_type);
  if (params?.category) queryParams.set("category", params.category);
  if (params?.is_uncertain !== undefined) queryParams.set("is_uncertain", String(params.is_uncertain));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  if (params?.offset) queryParams.set("offset", String(params.offset));

  const url = `${BASE_URL}/memories${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to list memories: ${res.statusText}`);
  }
  return res.json();
}

export async function createMemory(payload: import("../types").MemoryCreateRequest): Promise<import("../types").MemoryItem> {
  const res = await fetch(`${BASE_URL}/memories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create memory: ${res.statusText}`);
  }
  return res.json();
}

export async function getMemory(id: string): Promise<import("../types").MemoryItem> {
  const res = await fetch(`${BASE_URL}/memories/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch memory: ${res.statusText}`);
  }
  return res.json();
}

export async function updateMemory(id: string, payload: import("../types").MemoryUpdateRequest): Promise<import("../types").MemoryItem> {
  const res = await fetch(`${BASE_URL}/memories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update memory: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteMemory(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/memories/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete memory: ${res.statusText}`);
  }
}

export async function clearAllMemories(): Promise<{ deleted_count: number }> {
  const res = await fetch(`${BASE_URL}/memories/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirm: true }),
  });
  if (!res.ok) {
    throw new Error(`Failed to clear memories: ${res.statusText}`);
  }
  return res.json();
}

export async function exportMemories(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}/memories/export`);
  if (!res.ok) {
    throw new Error(`Failed to export memories: ${res.statusText}`);
  }
  return res.json();
}


