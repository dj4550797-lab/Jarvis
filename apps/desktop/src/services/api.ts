import { HealthResponse, TaskItem, TaskListResponse, MemoryItem, CommandRequest } from '../types';

const API_BASE = '/api/v1';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status: ${res.status}`);
  }
  return res.json();
}

export async function fetchStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) {
    throw new Error(`Status check failed with status: ${res.status}`);
  }
  return res.json();
}

export async function submitCommand(req: CommandRequest): Promise<TaskItem> {
  const res = await fetch(`${API_BASE}/tasks/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    throw new Error(`Command submission failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTasks(limit = 10): Promise<TaskListResponse> {
  const res = await fetch(`${API_BASE}/tasks?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchMemories(limit = 20): Promise<MemoryItem[]> {
  const res = await fetch(`${API_BASE}/memories?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch memories: ${res.statusText}`);
  }
  return res.json();
}

export async function approveTask(taskId: string): Promise<TaskItem> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/approve`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to approve task: ${res.statusText}`);
  }
  return res.json();
}

export async function cancelTask(taskId: string): Promise<TaskItem> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to cancel task: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchProviders(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/providers`);
  if (!res.ok) throw new Error('Failed to fetch providers');
  return res.json();
}

export async function fetchLocalModels(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/models/local`);
  if (!res.ok) throw new Error('Failed to fetch local models');
  return res.json();
}

export async function fetchLogs(lines = 100): Promise<{ file_exists: boolean; lines: string[] }> {
  const res = await fetch(`${API_BASE}/diagnostics/logs?lines=${lines}`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function fetchAuditTrail(limit = 50): Promise<any[]> {
  const res = await fetch(`${API_BASE}/diagnostics/audit?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch audit trail');
  return res.json();
}

export async function fetchBackups(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/backups`);
  if (!res.ok) throw new Error('Failed to fetch backups');
  return res.json();
}

export async function createBackup(): Promise<any> {
  const res = await fetch(`${API_BASE}/backups/create`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create backup');
  return res.json();
}
