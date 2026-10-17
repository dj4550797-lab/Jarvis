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

