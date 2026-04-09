"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { ColumnData } from "./Column";

interface NewTaskFormProps {
  columnId: string;
  columns: ColumnData[];
  onSubmit: (task: {
    columnId: string;
    title: string;
    priority: "low" | "medium" | "high";
    description?: string;
    dueDate?: string;
    tags?: string[];
  }) => void;
  onClose: () => void;
}

export default function NewTaskForm({
  columnId,
  columns,
  onSubmit,
  onClose,
}: NewTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [selectedColumnId, setSelectedColumnId] = useState(columnId);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required");
      return;
    }
    setError(null);
    onSubmit({
      columnId: selectedColumnId,
      title: trimmed,
      priority,
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
    });
  };

  return (
    <Modal open={true} onClose={onClose} title="New Task">
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
            htmlFor="new-task-title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="new-task-title"
            type="text"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="new-task-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="new-task-description"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[60px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details..."
          />
        </div>

        {/* Priority + Column */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="new-task-priority"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Priority
            </label>
            <select
              id="new-task-priority"
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
              htmlFor="new-task-column"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Column
            </label>
            <select
              id="new-task-column"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
              value={selectedColumnId}
              onChange={(e) => setSelectedColumnId(e.target.value)}
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
            htmlFor="new-task-due-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Due date
          </label>
          <input
            id="new-task-due-date"
            type="date"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create task</Button>
        </div>
      </div>
    </Modal>
  );
}
