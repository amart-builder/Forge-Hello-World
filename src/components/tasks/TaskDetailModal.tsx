"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { TaskData } from "./TaskCard";
import type { ColumnData } from "./Column";

interface TaskDetailModalProps {
  task: TaskData | null;
  columns: ColumnData[];
  open: boolean;
  onClose: () => void;
  onSave: (
    taskId: string,
    updates: Partial<
      Omit<TaskData, "_id" | "createdAt" | "updatedAt" | "position">
    >
  ) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskDetailModal({
  task,
  columns,
  open,
  onClose,
  onSave,
  onDelete,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [columnId, setColumnId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setDueDate(task.dueDate ?? "");
      setTags(task.tags);
      setTagsInput("");
      setColumnId(task.columnId);
      setError(null);
      setConfirmDelete(false);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      onSave(task._id, {
        title: trimmedTitle,
        description,
        priority,
        dueDate: dueDate || undefined,
        tags,
        columnId,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save task"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagsInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagsInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(task._id);
    onClose();
  };

  const createdDate = new Date(task.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const updatedDate = new Date(task.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Modal open={open} onClose={onClose} title="Task Details" className="max-w-xl">
      <div className="space-y-4">
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label
            htmlFor="task-title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title
          </label>
          <input
            id="task-title"
            type="text"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="task-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="task-description"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[80px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
          />
        </div>

        {/* Priority + Column row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="task-priority"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Priority
            </label>
            <select
              id="task-priority"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "low" | "medium" | "high")
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="task-column"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Column
            </label>
            <select
              id="task-column"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
            >
              {columns.map((col) => (
                <option key={col._id} value={col._id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due date */}
        <div>
          <label
            htmlFor="task-due-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Due date
          </label>
          <input
            id="task-due-date"
            type="date"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div>
          <label
            htmlFor="task-tags"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tags
          </label>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
                <button
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  x
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              id="task-tags"
              type="text"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Add a tag"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddTag}
              disabled={!tagsInput.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-400 flex gap-4 pt-2 border-t border-gray-100">
          <span>Created: {createdDate}</span>
          <span>Updated: {updatedDate}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">Are you sure?</span>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  Yes, delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleDelete}>
                Delete task
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
