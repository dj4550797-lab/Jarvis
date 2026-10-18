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

// --- Devices and Diagnostics API (Phase 4) ---

export async function fetchDevices(): Promise<import("../types").DeviceInventory> {
  const res = await fetch(`${BASE_URL}/devices`);
  if (!res.ok) {
    throw new Error(`Failed to fetch devices: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAudioDevices(): Promise<{ inputs: import("../types").DeviceInfo[]; outputs: import("../types").DeviceInfo[] }> {
  const res = await fetch(`${BASE_URL}/devices/audio`);
  if (!res.ok) {
    throw new Error(`Failed to fetch audio devices: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDisplays(): Promise<import("../types").DisplayInfo[]> {
  const res = await fetch(`${BASE_URL}/devices/displays`);
  if (!res.ok) {
    throw new Error(`Failed to fetch displays: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchPermissions(): Promise<import("../types").PermissionStatus[]> {
  const res = await fetch(`${BASE_URL}/devices/permissions`);
  if (!res.ok) {
    throw new Error(`Failed to fetch permissions: ${res.statusText}`);
  }
  return res.json();
}

// --- Voice Interaction API (Phase 4) ---

export async function fetchVoiceStatus(): Promise<import("../types").VoiceStatusResponse> {
  const res = await fetch(`${BASE_URL}/voice/status`);
  if (!res.ok) {
    throw new Error(`Failed to fetch voice status: ${res.statusText}`);
  }
  return res.json();
}

export async function transcribeAudio(
  audioBase64?: string,
  hint?: string,
  engine: string = "mock"
): Promise<import("../types").TranscriptionResponse> {
  const res = await fetch(`${BASE_URL}/voice/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio_base64: audioBase64, hint, engine }),
  });
  if (!res.ok) {
    throw new Error(`Failed to transcribe audio: ${res.statusText}`);
  }
  return res.json();
}

export async function synthesizeSpeech(
  text: string,
  voice?: string,
  speed: number = 1.0,
  engine: string = "mock"
): Promise<Blob> {
  const res = await fetch(`${BASE_URL}/voice/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, speed, engine }),
  });
  if (!res.ok) {
    throw new Error(`Failed to synthesize speech: ${res.statusText}`);
  }
  return res.blob();
}

// --- Controlled Computer Tools API (Phase 5) ---

export async function fetchTools(): Promise<import("../types").ToolMetadata[]> {
  const res = await fetch(`${BASE_URL}/tools`);
  if (!res.ok) {
    throw new Error(`Failed to fetch tools: ${res.statusText}`);
  }
  return res.json();
}

export async function executeTool(
  name: string,
  parameters: Record<string, any> = {}
): Promise<import("../types").ToolResult> {
  const res = await fetch(`${BASE_URL}/tools/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, parameters }),
  });

  if (res.status === 409) {
    const err = await res.json().catch(() => ({ detail: "Emergency stop active" }));
    throw new Error(`[Emergency Stop Active] ${err.detail}`);
  }

  if (res.status === 403) {
    const err = await res.json().catch(() => ({ detail: "Operation prohibited by security policy" }));
    throw new Error(`[Security Policy Violation] ${err.detail}`);
  }

  if (!res.ok) {
    throw new Error(`Tool execution request failed: HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchEmergencyStopStatus(): Promise<import("../types").EmergencyStopStatus> {
  const res = await fetch(`${BASE_URL}/tools/emergency-stop`);
  if (!res.ok) {
    throw new Error(`Failed to fetch emergency stop status: ${res.statusText}`);
  }
  return res.json();
}

export async function controlEmergencyStop(
  action: "engage" | "reset",
  reason?: string,
  confirmed?: boolean
): Promise<import("../types").EmergencyStopStatus> {
  const res = await fetch(`${BASE_URL}/tools/emergency-stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, reason, confirmed }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Failed to update emergency stop: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchToolAuditLogs(limit: number = 50): Promise<import("../types").ToolAuditLog[]> {
  const res = await fetch(`${BASE_URL}/tools/audit?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch tool audit logs: ${res.statusText}`);
  }
  return res.json();
}

// ==========================================
// Phase 6: Background Tasks API
// ==========================================

export async function fetchTasks(status?: string): Promise<import("../types").BackgroundTask[]> {
  const url = status ? `${BASE_URL}/tasks?status=${encodeURIComponent(status)}` : `${BASE_URL}/tasks`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTaskById(taskId: string): Promise<import("../types").BackgroundTask> {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch task ${taskId}: ${res.statusText}`);
  }
  return res.json();
}

export async function enqueueTask(payload: import("../types").TaskEnqueuePayload): Promise<import("../types").BackgroundTask> {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Failed to enqueue task: ${res.statusText}`);
  }
  return res.json();
}

export async function cancelTask(taskId: string): Promise<{ status: string; task_id: string; cancelled: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}/cancel`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Failed to cancel task: ${res.statusText}`);
  }
  return res.json();
}

export async function recoverTasks(): Promise<{ status: string; interrupted_task_count: number; interrupted_task_ids: string[] }> {
  const res = await fetch(`${BASE_URL}/tasks/recover`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to recover tasks: ${res.statusText}`);
  }
  return res.json();
}

// ==========================================
// Phase 6: Notifications API
// ==========================================

export async function fetchNotifications(
  unreadOnly: boolean = false,
  category?: string,
  limit: number = 50
): Promise<import("../types").NotificationItem[]> {
  const params = new URLSearchParams();
  if (unreadOnly) params.set("unread_only", "true");
  if (category) params.set("category", category);
  params.set("limit", String(limit));

  const res = await fetch(`${BASE_URL}/notifications?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch notifications: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const res = await fetch(`${BASE_URL}/notifications/unread-count`);
  if (!res.ok) {
    throw new Error(`Failed to fetch unread notification count: ${res.statusText}`);
  }
  const data = await res.json();
  return data.unread_count || 0;
}

export async function markNotificationRead(id: string): Promise<import("../types").NotificationItem> {
  const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
    method: "PATCH",
  });
  if (!res.ok) {
    throw new Error(`Failed to mark notification read: ${res.statusText}`);
  }
  return res.json();
}

export async function markAllNotificationsRead(): Promise<number> {
  const res = await fetch(`${BASE_URL}/notifications/mark-all-read`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to mark all notifications read: ${res.statusText}`);
  }
  const data = await res.json();
  return data.marked_read_count || 0;
}

export async function deleteNotification(id: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/notifications/${id}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function fetchNotificationPreferences(): Promise<import("../types").NotificationPreference> {
  const res = await fetch(`${BASE_URL}/notifications/preferences`);
  if (!res.ok) {
    throw new Error(`Failed to fetch notification preferences: ${res.statusText}`);
  }
  return res.json();
}

export async function updateNotificationPreferences(
  payload: Partial<import("../types").NotificationPreference>
): Promise<import("../types").NotificationPreference> {
  const res = await fetch(`${BASE_URL}/notifications/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Failed to update notification preferences: ${res.statusText}`);
  }
  return res.json();
}
