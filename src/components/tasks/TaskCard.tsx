"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

export interface TaskData {
  _id: string;
  columnId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  tags: string[];
  position: number;
  createdAt: number;
  updatedAt: number;
}

const PRIORITY_VARIANT: Record<
  TaskData["priority"],
  "success" | "warning" | "error"
> = {
  low: "success",
  medium: "warning",
  high: "error",
};

const PRIORITY_LABEL: Record<TaskData["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

interface TaskCardProps {
  task: TaskData;
  onClick: (task: TaskData) => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white border border-gray-200 rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow",
        isDragging && "opacity-50 shadow-lg ring-2 ring-gray-300"
      )}
      onClick={() => {
        // Don't open modal if we're in a drag
        if (!isDragging) {
          onClick(task);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}. Priority: ${PRIORITY_LABEL[task.priority]}${task.dueDate ? `. Due: ${task.dueDate}` : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(task);
        }
      }}
    >
      <p className="text-sm font-medium text-gray-900 line-clamp-2">
        {task.title}
      </p>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <Badge variant={PRIORITY_VARIANT[task.priority]}>
          {PRIORITY_LABEL[task.priority]}
        </Badge>

        {task.dueDate && (
          <span className="text-xs text-gray-500">{task.dueDate}</span>
        )}
      </div>

      {task.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {task.tags.map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
