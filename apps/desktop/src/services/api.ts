import { HealthResponse, TaskItem, TaskListResponse, MemoryItem, CommandRequest } from '../types';

const API_BASE = '/api/v1';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status: ${res.status}`);
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
