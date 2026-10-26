export type OperatingMode = 'offline' | 'online_hybrid';

export type TaskStatus =
  | 'Draft'
  | 'Queued'
  | 'Running'
  | 'AwaitingApproval'
  | 'Paused'
  | 'Completed'
  | 'PartiallyCompleted'
  | 'Failed'
  | 'Cancelled'
  | 'Blocked';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface DatabaseHealth {
  connected: boolean;
  wal_enabled: boolean;
  schema_version: string;
  total_tasks: number;
  total_memories: number;
}

export interface LocalAIHealth {
  model_loaded: string | null;
  runtime: string;
  device: string;
  status: string;
}

export interface SystemResources {
  cpu_pct: number;
  ram_used_mb: number;
  ram_total_mb: number;
  disk_free_gb: number;
}

export interface HealthResponse {
  status: string;
  version: string;
  mode: OperatingMode;
  database: DatabaseHealth;
  local_ai: LocalAIHealth;
  system_resources: SystemResources;
}

export interface CommandRequest {
  command: string;
  device_id?: string;
  allow_elevation?: boolean;
}

export interface TaskListResponse {
  total: number;
  tasks: TaskItem[];
}

export interface TaskStep {
  id: string;
  step_order: number;
  action_type: string;
  status: string;
  output_data?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface TaskItem {
  id: string;
  title: string;
  command_raw: string;
  status: TaskStatus;
  risk_level: RiskLevel;
  requires_approval: boolean;
  approved_at?: string | null;
  progress_pct: number;
  device_id: string;
  result_summary?: string | null;
  error_details?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  steps: TaskStep[];
}

export interface MemoryItem {
  id: string;
  memory_type: 'fact' | 'preference' | 'episodic' | 'project_context';
  category: 'user' | 'system' | 'coding' | 'personal' | 'device';
  content: string;
  source_ref?: string | null;
  importance: number;
  access_count: number;
  is_sensitive: boolean;
  created_at: string;
  last_accessed_at: string;
}
