"use client";

import { useEffect, useState } from "react";
import { fetchTask, updateTask, fetchUsers, fetchTaskActivities } from "@/lib/api";
import type { Task, Profile, TaskStatus, TaskPriority, TaskActivity } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { formatDate, statusColor, statusLabel, priorityColor, getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    status: "pending" as TaskStatus,
    assigned_to: "",
    due_date: "",
  });

  useEffect(() => {
    Promise.all([fetchTask(id), fetchUsers(), fetchTaskActivities(id)])
      .then(([t, u, a]) => {
        setTask(t);
        setUsers(u);
        setActivities(a);
        setForm({
          title: t.title,
          description: t.description || "",
          priority: t.priority,
          status: t.status,
          assigned_to: t.assigned_to || "",
          due_date: t.due_date ? t.due_date.split("T")[0] : "",
        });
      })
      .catch(() => toast.error("Failed to load task"))
      .finally(() => setLoading(false));
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateTask(id, {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        status: form.status,
        assigned_to: form.assigned_to || null,
        due_date: form.due_date || null,
      });
      setTask(updated);
      setEditing(false);
      // Refresh activity log
      fetchTaskActivities(id).then(setActivities);
      if (form.status === "completed" && task?.status !== "completed") {
        toast.success("Task marked complete! Creator has been notified.");
      } else {
        toast.success("Task updated");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) {
    return <div className="card text-center py-12 text-gray-400">Task not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
        ← Back
      </button>

      {/* Task Card */}
      <div className="card space-y-5">
        <div className="flex items-start justify-between gap-4">
          {editing ? (
            <input name="title" className="input text-xl font-bold" value={form.title} onChange={handleChange} />
          ) : (
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
          )}
          <button
            onClick={() => setEditing((e) => !e)}
            className="btn-secondary text-sm shrink-0"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <select name="status" className="input w-auto text-sm" value={form.status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select name="priority" className="input w-auto text-sm" value={form.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </>
          ) : (
            <>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(task.status)}`}>
                {statusLabel(task.status)}
              </span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${priorityColor(task.priority)}`}>
                {task.priority} priority
              </span>
            </>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          {editing ? (
            <textarea name="description" rows={4} className="input resize-none" value={form.description} onChange={handleChange} />
          ) : (
            <p className="text-gray-600 text-sm">{task.description || "No description."}</p>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="label">Created By</span>
            <p className="text-gray-700">{task.creator?.full_name || task.creator?.email || "—"}</p>
          </div>
          <div>
            <span className="label">Assigned To</span>
            {editing ? (
              <select name="assigned_to" className="input" value={form.assigned_to} onChange={handleChange}>
                <option value="">— Unassigned —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                ))}
              </select>
            ) : (
              <p className="text-gray-700">{task.assignee?.full_name || task.assignee?.email || "Unassigned"}</p>
            )}
          </div>
          <div>
            <span className="label">Due Date</span>
            {editing ? (
              <input type="date" name="due_date" className="input" value={form.due_date} onChange={handleChange} />
            ) : (
              <p className="text-gray-700">{formatDate(task.due_date)}</p>
            )}
          </div>
          <div>
            <span className="label">Created</span>
            <p className="text-gray-700">{formatDate(task.created_at)}</p>
          </div>
        </div>

        {/* Save button */}
        {editing && (
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Activity Log</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-400">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {activities.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {getInitials(a.actor?.full_name, a.actor?.id || "?")}
                </div>
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">{a.actor?.full_name || "Someone"}</span>{" "}
                    <span className="capitalize">{a.action}</span> this task
                  </p>
                  <p className="text-gray-400 text-xs">{formatDate(a.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
