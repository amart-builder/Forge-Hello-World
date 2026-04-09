"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import type { ColumnData } from "@/components/tasks/Column";
import type { TaskData } from "@/components/tasks/TaskCard";
import { useToast } from "@/components/ui/Toast";

export default function TasksPage() {
  // Queries
  const columnsRaw = useQuery(api.columns.list);
  const tasksRaw = useQuery(api.tasks.list, {});

  const { showToast } = useToast();

  // Mutations
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const moveTask = useMutation(api.tasks.move);
  const deleteTask = useMutation(api.tasks.remove);
  const createColumn = useMutation(api.columns.create);
  const renameColumn = useMutation(api.columns.rename);
  const deleteColumn = useMutation(api.columns.remove);
  const reorderColumn = useMutation(api.columns.updatePosition);

  // Type-safe wrappers
  const columns: ColumnData[] | undefined = columnsRaw as
    | ColumnData[]
    | undefined;
  const tasks: TaskData[] | undefined = tasksRaw as TaskData[] | undefined;

  const handleCreateTask = async (task: {
    columnId: string;
    title: string;
    priority: "low" | "medium" | "high";
    description?: string;
    dueDate?: string;
    tags?: string[];
  }) => {
    try {
      await createTask({
        columnId: task.columnId as never,
        title: task.title,
        priority: task.priority,
        description: task.description,
        dueDate: task.dueDate,
        tags: task.tags,
      });
    } catch {
      showToast("Failed to create task. Please try again.");
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    updates: Partial<
      Omit<TaskData, "_id" | "createdAt" | "updatedAt" | "position">
    >
  ) => {
    try {
      await updateTask({
        id: taskId as never,
        ...updates,
        columnId: updates.columnId as never | undefined,
      });
    } catch {
      showToast("Failed to update task. Please try again.");
    }
  };

  const handleMoveTask = async (
    taskId: string,
    columnId: string,
    position: number
  ) => {
    try {
      await moveTask({
        id: taskId as never,
        columnId: columnId as never,
        position,
      });
    } catch {
      showToast("Failed to move task. Please try again.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask({ id: taskId as never });
    } catch {
      showToast("Failed to delete task. Please try again.");
    }
  };

  const handleCreateColumn = async (name: string) => {
    try {
      await createColumn({ name });
    } catch {
      showToast("Failed to create column. Please try again.");
    }
  };

  const handleRenameColumn = async (columnId: string, name: string) => {
    try {
      await renameColumn({ id: columnId as never, name });
    } catch {
      showToast("Failed to rename column. Please try again.");
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await deleteColumn({ id: columnId as never });
    } catch {
      showToast("Failed to delete column. Please try again.");
    }
  };

  const handleReorderColumn = async (
    columnId: string,
    position: number
  ) => {
    try {
      await reorderColumn({ id: columnId as never, position });
    } catch {
      showToast("Failed to reorder column. Please try again.");
    }
  };

  return (
    <div className="h-full overflow-hidden">
      <KanbanBoard
        columns={columns}
        tasks={tasks}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        onMoveTask={handleMoveTask}
        onDeleteTask={handleDeleteTask}
        onCreateColumn={handleCreateColumn}
        onRenameColumn={handleRenameColumn}
        onDeleteColumn={handleDeleteColumn}
        onReorderColumn={handleReorderColumn}
      />
    </div>
  );
}
