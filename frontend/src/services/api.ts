import { Conversation, HealthResponse, Message } from "../types";

const BASE_URL = "/api/v1";

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Failed to fetch health status: ${res.statusText}`);
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

export async function createConversation(title: string = "New Conversation"): Promise<Conversation> {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
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

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    throw new Error(`Failed to send message: ${res.statusText}`);
  }
  return res.json();
}
