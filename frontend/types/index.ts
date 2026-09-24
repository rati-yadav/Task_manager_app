export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  created_by: string;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  assignee?: Profile | null;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  actor_id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor?: Profile;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority: TaskPriority;
  assigned_to?: string | null;
  due_date?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_to?: string | null;
  due_date?: string | null;
}
