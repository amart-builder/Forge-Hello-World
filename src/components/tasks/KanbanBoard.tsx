"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import Column, { type ColumnData } from "./Column";
import TaskCard, { type TaskData } from "./TaskCard";
import TaskDetailModal from "./TaskDetailModal";
import NewTaskForm from "./NewTaskForm";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Button from "@/components/ui/Button";

interface KanbanBoardProps {
  columns: ColumnData[] | undefined;
  tasks: TaskData[] | undefined;
  onCreateTask: (task: {
    columnId: string;
    title: string;
    priority: "low" | "medium" | "high";
    description?: string;
    dueDate?: string;
    tags?: string[];
  }) => void;
  onUpdateTask: (
    taskId: string,
    updates: Partial<
      Omit<TaskData, "_id" | "createdAt" | "updatedAt" | "position">
    >
  ) => void;
  onMoveTask: (taskId: string, columnId: string, position: number) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateColumn: (name: string) => void;
  onRenameColumn: (columnId: string, name: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onReorderColumn: (columnId: string, position: number) => void;
}

export default function KanbanBoard({
  columns,
  tasks,
  onCreateTask,
  onUpdateTask,
  onMoveTask,
  onDeleteTask,
  onCreateColumn,
  onRenameColumn,
  onDeleteColumn,
  onReorderColumn,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTaskColumnId, setNewTaskColumnId] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    columnId: string;
    taskCount: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const map = new Map<string, TaskData[]>();
    if (columns) {
      for (const col of columns) {
        map.set(col._id, []);
      }
    }
    if (tasks) {
      for (const task of tasks) {
        const arr = map.get(task.columnId);
        if (arr) {
          arr.push(task);
        }
      }
    }
    return map;
  }, [columns, tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks?.find((t) => t._id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !tasks || !columns) return;

    const activeTaskId = active.id as string;
    const activeTaskData = tasks.find((t) => t._id === activeTaskId);
    if (!activeTaskData) return;

    // Determine target column
    let targetColumnId: string;
    let targetPosition: number;

    const overId = over.id as string;

    if (overId.startsWith("column-")) {
      // Dropped on an empty column area
      targetColumnId = overId.replace("column-", "");
      const columnTasks = tasksByColumn.get(targetColumnId) ?? [];
      targetPosition =
        columnTasks.length > 0
          ? Math.max(...columnTasks.map((t) => t.position)) + 1.0
          : 1.0;
    } else {
      // Dropped on another task
      const overTask = tasks.find((t) => t._id === overId);
      if (!overTask) return;

      targetColumnId = overTask.columnId;
      const columnTasks = (tasksByColumn.get(targetColumnId) ?? [])
        .filter((t) => t._id !== activeTaskId)
        .sort((a, b) => a.position - b.position);

      const overIndex = columnTasks.findIndex((t) => t._id === overId);

      if (overIndex === 0) {
        // Place before the first task
        targetPosition = columnTasks[0].position / 2;
      } else if (overIndex === columnTasks.length - 1) {
        // Place after the last task
        targetPosition = columnTasks[overIndex].position + 1.0;
      } else {
        // Place between two tasks
        const before = columnTasks[overIndex - 1].position;
        const after = columnTasks[overIndex].position;
        targetPosition = (before + after) / 2;
      }
    }

    // Only update if something changed
    if (
      activeTaskData.columnId !== targetColumnId ||
      activeTaskData.position !== targetPosition
    ) {
      onMoveTask(activeTaskId, targetColumnId, targetPosition);
    }
  };

  const handleTaskClick = (task: TaskData) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleTaskSave = (
    taskId: string,
    updates: Partial<
      Omit<TaskData, "_id" | "createdAt" | "updatedAt" | "position">
    >
  ) => {
    onUpdateTask(taskId, updates);
  };

  const handleAddColumn = () => {
    const trimmed = newColumnName.trim();
    if (!trimmed) return;
    onCreateColumn(trimmed);
    setNewColumnName("");
    setAddingColumn(false);
  };

  const handleDeleteColumn = (columnId: string, taskCount: number) => {
    if (taskCount > 0) {
      setDeleteConfirm({ columnId, taskCount });
    } else {
      onDeleteColumn(columnId);
    }
  };

  const handleMoveColumn = (columnId: string, direction: "left" | "right") => {
    if (!columns) return;
    const sorted = [...columns].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((c) => c._id === columnId);
    if (idx < 0) return;

    const swapIdx = direction === "left" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    // Swap positions
    const currentPos = sorted[idx].position;
    const swapPos = sorted[swapIdx].position;
    onReorderColumn(sorted[idx]._id, swapPos);
    onReorderColumn(sorted[swapIdx]._id, currentPos);
  };

  const confirmColumnDelete = () => {
    if (deleteConfirm) {
      onDeleteColumn(deleteConfirm.columnId);
      setDeleteConfirm(null);
    }
  };

  // Loading state
  if (columns === undefined || tasks === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Empty state — no columns at all.
  // When addingColumn is true, fall through to the main render so the inline
  // add-column form appears. Otherwise the Add column button would be dead
  // (setting addingColumn=true would just re-render this same empty state).
  if (columns.length === 0 && !addingColumn) {
    return (
      <EmptyState
        title="No columns yet"
        description="Add your first column to start organizing tasks."
        action={
          <Button onClick={() => setAddingColumn(true)}>Add column</Button>
        }
      />
    );
  }

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto h-full px-4 py-4">
          {sortedColumns.map((column, idx) => (
            <Column
              key={column._id}
              column={column}
              tasks={tasksByColumn.get(column._id) ?? []}
              onTaskClick={handleTaskClick}
              onAddTask={(colId) => setNewTaskColumnId(colId)}
              onRenameColumn={onRenameColumn}
              onDeleteColumn={handleDeleteColumn}
              onMoveColumn={handleMoveColumn}
              isFirst={idx === 0}
              isLast={idx === sortedColumns.length - 1}
            />
          ))}

          {/* Add column button */}
          <div className="flex-shrink-0 w-72">
            {addingColumn ? (
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <input
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Column name"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddColumn();
                    if (e.key === "Escape") {
                      setAddingColumn(false);
                      setNewColumnName("");
                    }
                  }}
                  autoFocus
                  aria-label="New column name"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddColumn}>
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAddingColumn(false);
                      setNewColumnName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
                onClick={() => setAddingColumn(true)}
                aria-label="Add new column"
              >
                + Add column
              </button>
            )}
          </div>
        </div>

        {/* Drag overlay — shows a preview of the card being dragged */}
        <DragOverlay>
          {activeTask ? (
            <div className="opacity-90 rotate-2">
              <TaskCard task={activeTask} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task detail modal */}
      <TaskDetailModal
        task={selectedTask}
        columns={sortedColumns}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleTaskSave}
        onDelete={onDeleteTask}
      />

      {/* New task form modal */}
      {newTaskColumnId && (
        <NewTaskForm
          columnId={newTaskColumnId}
          columns={sortedColumns}
          onSubmit={(task) => {
            onCreateTask(task);
            setNewTaskColumnId(null);
          }}
          onClose={() => setNewTaskColumnId(null)}
        />
      )}

      {/* Column delete confirmation dialog */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm column deletion"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Delete column?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This column has {deleteConfirm.taskCount} task
              {deleteConfirm.taskCount === 1 ? "" : "s"}. Deleting it will
              permanently remove all tasks in this column.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmColumnDelete}>
                Delete column
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
