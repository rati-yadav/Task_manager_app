import Link from "next/link";
import type { Task } from "@/types";
import { formatDate, statusColor, statusLabel, priorityColor, getInitials } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onDelete?: (id: string) => void;
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <Link href={`/tasks/${task.id}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600 leading-snug">
          {task.title}
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
            title="Delete task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(task.status)}`}>
          {statusLabel(task.status)}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${priorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
        <span>Due: {formatDate(task.due_date)}</span>
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
              {getInitials(task.assignee.full_name, task.assignee.email)}
            </div>
            <span className="truncate max-w-[100px]">
              {task.assignee.full_name || task.assignee.email}
            </span>
          </div>
        ) : (
          <span>Unassigned</span>
        )}
      </div>
    </div>
  );
}
