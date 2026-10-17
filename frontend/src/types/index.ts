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


