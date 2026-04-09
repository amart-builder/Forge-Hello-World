"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import TaskCard, { type TaskData } from "./TaskCard";
import { useState, useRef, useEffect } from "react";

export interface ColumnData {
  _id: string;
  name: string;
  position: number;
  createdAt: number;
}

interface ColumnProps {
  column: ColumnData;
  tasks: TaskData[];
  onTaskClick: (task: TaskData) => void;
  onAddTask: (columnId: string) => void;
  onRenameColumn: (columnId: string, name: string) => void;
  onDeleteColumn: (columnId: string, taskCount: number) => void;
  onMoveColumn?: (columnId: string, direction: "left" | "right") => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function Column({
  column,
  tasks,
  onTaskClick,
  onAddTask,
  onRenameColumn,
  onDeleteColumn,
  onMoveColumn,
  isFirst = false,
  isLast = false,
}: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column._id}`,
    data: { type: "column", columnId: column._id },
  });

  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);
  const taskIds = sortedTasks.map((t) => t._id);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close menu on click outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const handleRenameSubmit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== column.name) {
      onRenameColumn(column._id, trimmed);
    } else {
      setEditName(column.name);
    }
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-gray-50 rounded-xl w-72 min-w-[18rem] max-h-full",
        isOver && "ring-2 ring-blue-300 bg-blue-50/30"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isEditing ? (
            <input
              ref={inputRef}
              className="text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded px-1.5 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-gray-400"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") {
                  setEditName(column.name);
                  setIsEditing(false);
                }
              }}
              aria-label="Column name"
            />
          ) : (
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {column.name}
            </h3>
          )}
          <span className="text-xs text-gray-400 font-medium flex-shrink-0">
            {tasks.length}
          </span>
        </div>

        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
            onClick={() => setShowMenu(!showMenu)}
            aria-label={`Column options for ${column.name}`}
            aria-haspopup="true"
            aria-expanded={showMenu}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
              <button
                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setShowMenu(false);
                  setIsEditing(true);
                }}
              >
                Rename
              </button>
              {onMoveColumn && !isFirst && (
                <button
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setShowMenu(false);
                    onMoveColumn(column._id, "left");
                  }}
                >
                  Move left
                </button>
              )}
              {onMoveColumn && !isLast && (
                <button
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setShowMenu(false);
                    onMoveColumn(column._id, "right");
                  }}
                >
                  Move right
                </button>
              )}
              <button
                className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => {
                  setShowMenu(false);
                  onDeleteColumn(column._id, tasks.length);
                }}
              >
                Delete{tasks.length > 0 ? ` (${tasks.length} tasks)` : ""}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task list — droppable */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-2 py-2 space-y-2 min-h-[60px]"
      >
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {sortedTasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">
            No tasks yet
          </p>
        )}
      </div>

      {/* Add task button */}
      <div className="px-2 pb-2">
        <button
          className="w-full py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => onAddTask(column._id)}
          aria-label={`Add task to ${column.name}`}
        >
          + Add task
        </button>
      </div>
    </div>
  );
}
