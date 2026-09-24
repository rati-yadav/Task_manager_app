import { supabase } from "./supabase";
import type { Task, Profile, TaskActivity, CreateTaskPayload, UpdateTaskPayload } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Core fetch wrapper.
 * Automatically attaches the Supabase JWT as a Bearer token so Flask
 * can verify who is making each request.
 */
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ── Tasks ──────────────────────────────────────────────────────────────────

export async function fetchMyTasks(): Promise<Task[]> {
  return apiFetch<Task[]>("/api/tasks/");
}

export async function fetchAllTasks(): Promise<Task[]> {
  return apiFetch<Task[]>("/api/tasks/all");
}

export async function fetchTask(id: string): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}`);
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  return apiFetch<Task>("/api/tasks/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTask(id: string): Promise<void> {
  return apiFetch<void>(`/api/tasks/${id}`, { method: "DELETE" });
}

export async function fetchTaskActivities(id: string): Promise<TaskActivity[]> {
  return apiFetch<TaskActivity[]>(`/api/tasks/${id}/activities`);
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<Profile[]> {
  return apiFetch<Profile[]>("/api/users/");
}

export async function fetchMe(): Promise<Profile> {
  return apiFetch<Profile>("/api/auth/me");
}
