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

// --- Notifications and Background Tasks (Phase 6) ---

export type TaskStatusType =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "interrupted";

export interface BackgroundTask {
  id: string;
  name: string;
  task_type: string;
  status: TaskStatusType;
  progress: number;
  progress_message?: string | null;
  params: Record<string, any>;
  result?: any;
  error?: string | null;
  timeout_seconds: number;
  idempotent: boolean;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
}

export interface TaskEnqueuePayload {
  name: string;
  task_type: string;
  params?: Record<string, any>;
  timeout_seconds?: number;
  idempotent?: boolean;
}

export type NotificationPriorityType = "low" | "normal" | "high" | "critical";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriorityType;
  category: "task" | "system" | "security" | "reminder" | "general" | string;
  read: boolean;
  delivered: boolean;
  suppressed_by_dnd: boolean;
  created_at: string;
  read_at?: string | null;
  metadata?: Record<string, any>;
}

export interface NotificationPreference {
  id: string;
  dnd_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  min_priority_during_quiet: NotificationPriorityType | string;
  desktop_notifications_enabled: boolean;
  sound_enabled: boolean;
  updated_at?: string | null;
}

// --- Phase 7: Coding & Research Assistance Types ---

export interface CodeFileItem {
  name: string;
  relative_path: string;
  absolute_path: string;
  extension: string;
  size_bytes: number;
  line_count: number | null;
  is_text: boolean;
}

export interface ProjectInspectionResult {
  root_path: string;
  directory_count: number;
  total_files_scanned: number;
  capped: boolean;
  files: CodeFileItem[];
}

export interface CodeSearchMatch {
  file: string;
  relative_path: string;
  absolute_path: string;
  line_number: number;
  line_content: string;
}

export interface CodeSearchResult {
  root_path: string;
  query: string;
  is_regex: boolean;
  total_matches: number;
  capped: boolean;
  matches: CodeSearchMatch[];
}

export interface SyntaxErrorDetail {
  line: number | null;
  column: number | null;
  message: string;
  text: string;
}

export interface SyntaxValidationResult {
  valid: boolean;
  errors: SyntaxErrorDetail[];
  message: string;
}

export interface StackTraceFrame {
  file: string;
  line: number;
  function: string;
  code?: string;
  is_local_project_file?: boolean;
}

export interface DiagnosticAnalysis {
  primary_culprit: StackTraceFrame | null;
  summary: string;
  suggestions: string[];
}

export interface StackTraceDiagnosticResult {
  detected_language: string;
  error_type: string;
  error_message: string;
  total_frames: number;
  frames: StackTraceFrame[];
  analysis: DiagnosticAnalysis;
}

export interface DiffResult {
  filename: string;
  diff: string;
  has_changes: boolean;
}

export interface CodeSnapshot {
  id: string;
  file_path: string;
  original_content: string;
  diff_patch: string;
  reason: string;
  restored: boolean;
  created_at: string;
  restored_at?: string | null;
}

export interface TestRunResult {
  target: string;
  command: string;
  cwd: string;
  passed: boolean;
  exit_code: number;
  elapsed_ms: number;
  stdout: string;
  stderr: string;
  summary: string;
}

export interface ResearchSource {
  id: string;
  session_id: string;
  url?: string | null;
  title: string;
  snippet: string;
  is_verified: boolean;
  confidence: number;
  notes?: string | null;
  created_at: string;
}

export interface ResearchSession {
  id: string;
  title: string;
  topic: string;
  status: "active" | "completed" | "archived" | string;
  summary?: string | null;
  created_at: string;
  updated_at: string;
  sources?: ResearchSource[];
}

export interface ResearchReportExport {
  session_id: string;
  format: "markdown" | "json";
  content: string;
  filename: string;
}

