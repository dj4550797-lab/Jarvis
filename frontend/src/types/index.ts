export interface DatabaseHealth {
  status: "healthy" | "unhealthy" | "unknown";
  journal_mode?: string;
  foreign_keys?: boolean;
  url: string;
}

export interface SystemHardware {
  os: string;
  os_version: string;
  architecture: string;
  cpu_logical?: number;
  ram_total_gb?: number;
  disk_free_gb?: number;
}

export interface AIProviderStatus {
  configured_provider: string;
  local_model_enabled: boolean;
  local_model_name: string;
  status: "available" | "not_configured" | "unavailable";
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  environment: string;
  uptime_seconds: number;
  database: DatabaseHealth;
  hardware: SystemHardware;
  ai_provider: AIProviderStatus;
  data_directory: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  model?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface AIProviderInfo {
  name: string;
  available: boolean;
  models: string[];
  error?: string | null;
}

export interface MemoryItem {
  id: string;
  content: string;
  memory_type: "explicit_fact" | "preference" | "project_context" | "reminder" | "inferred" | string;
  category?: string | null;
  is_uncertain: boolean;
  confidence: number;
  source: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface MemoryCreateRequest {
  content: string;
  memory_type?: string;
  category?: string | null;
  is_uncertain?: boolean;
  confidence?: number;
  source?: string;
  tags?: string[];
}

export interface MemoryUpdateRequest {
  content?: string;
  memory_type?: string;
  category?: string | null;
  is_uncertain?: boolean;
  confidence?: number;
  tags?: string[];
}

export interface MemoryListResponse {
  total: number;
  items: MemoryItem[];
}

export interface DeviceInfo {
  id: string;
  name: string;
  kind: "audio_input" | "audio_output" | "camera" | "display";
  is_default: boolean;
  channels?: number;
  sample_rate?: number;
  manufacturer?: string;
  status: "available" | "busy" | "unsupported" | "error";
  extra: Record<string, any>;
}

export interface DisplayInfo {
  id: string;
  name: string;
  is_primary: boolean;
  width: number;
  height: number;
  scaling_percent: number;
}

export interface PermissionStatus {
  capability: "microphone" | "audio_output" | "camera" | "screen_capture";
  granted: boolean;
  status: "granted" | "denied" | "prompt" | "unsupported";
  reason?: string | null;
}

export interface DeviceInventory {
  audio_inputs: DeviceInfo[];
  audio_outputs: DeviceInfo[];
  cameras: DeviceInfo[];
  displays: DisplayInfo[];
  permissions: PermissionStatus[];
}

export interface VoiceEngineStatus {
  default_engine: string;
  available_engines: string[];
  ready: boolean;
}

export interface VoiceStatusResponse {
  stt: VoiceEngineStatus;
  tts: VoiceEngineStatus;
}

export interface TranscriptionResponse {
  text: string;
  confidence: number;
  language: string;
  duration_seconds: number;
  engine: string;
  is_final: boolean;
}

// --- Tools and Computer Operations (Phase 5) ---

export interface ToolMetadata {
  name: string;
  description: string;
  capability: string;
  requires_confirmation: boolean;
  parameters_schema: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  output?: any;
  error?: string | null;
  verifiable: boolean;
  requires_confirmation: boolean;
  confirmation_prompt?: string | null;
  metadata: Record<string, any>;
}

export interface EmergencyStopStatus {
  is_active: boolean;
  reason?: string | null;
  engaged_at?: string | null;
  interrupted_tasks_count: number;
}

export interface ToolAuditLog {
  id: string;
  event_type: string;
  component: string;
  severity: string;
  message: string;
  details: Record<string, any>;
  created_at: string;
}




