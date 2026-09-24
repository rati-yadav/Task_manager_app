"use client";

import { useEffect, useState } from "react";
import { fetchMyTasks } from "@/lib/api";
import type { Task } from "@/types";
import TaskCard from "@/components/TaskCard";
import { statusLabel } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTasks()
      .then(setTasks)
      .catch(() => toast.error("Failed to load tasks"))
      .finally(() => setLoading(false));
  }, []);

  const pending = tasks.filter((t) => t.status === "pending");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const completed = tasks.filter((t) => t.status === "completed");

  const stats = [
    { label: "Total Tasks", value: tasks.length, color: "text-primary-600" },
    { label: "Pending", value: pending.length, color: "text-yellow-600" },
    { label: "In Progress", value: inProgress.length, color: "text-blue-600" },
    { label: "Completed", value: completed.length, color: "text-green-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Your tasks and team activity</p>
        </div>
        <Link href="/tasks/new" className="btn-primary">
          + New Task
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Task Columns */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg">No tasks yet.</p>
          <Link href="/tasks/new" className="btn-primary mt-4 inline-block">
            Create your first task
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(["pending", "in_progress", "completed"] as const).map((status) => {
            const statusTasks = tasks.filter((t) => t.status === status);
            return (
              <div key={status}>
                <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  {statusLabel(status)}
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {statusTasks.length}
                  </span>
                </h2>
                <div className="space-y-3">
                  {statusTasks.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-lg">
                      No {statusLabel(status).toLowerCase()} tasks
                    </p>
                  ) : (
                    statusTasks.map((task) => <TaskCard key={task.id} task={task} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
