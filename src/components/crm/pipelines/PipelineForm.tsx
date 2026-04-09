"use client";

import { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export interface PipelineFormData {
  name: string;
  description: string;
  stages: string[];
}

interface PipelineFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PipelineFormData) => void;
  onDelete?: () => void;
  initial?: Partial<PipelineFormData>;
  mode: "create" | "edit";
}

const DEFAULT_STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won"];

export default function PipelineForm({
  open,
  onClose,
  onSubmit,
  onDelete,
  initial,
  mode,
}: PipelineFormProps) {
  const initialForm = useMemo(() => {
    return {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      stages: initial?.stages ?? (mode === "create" ? [...DEFAULT_STAGES] : []),
    };
  }, [initial, mode]);

  const [form, setForm] = useState<PipelineFormData>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [newStage, setNewStage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // prevOpen pattern for form reset
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setForm(initialForm);
    setError(null);
    setNewStage("");
    setConfirmDelete(false);
  }
  if (open !== prevOpen) setPrevOpen(open);

  const handleAddStage = () => {
    const trimmed = newStage.trim();
    if (!trimmed) return;
    if (form.stages.includes(trimmed)) {
      setError("Stage name already exists");
      return;
    }
    setForm((prev) => ({ ...prev, stages: [...prev.stages, trimmed] }));
    setNewStage("");
    setError(null);
  };

  const handleRemoveStage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index),
    }));
  };

  const handleMoveStage = (index: number, direction: "up" | "down") => {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= form.stages.length) return;
    const newStages = [...form.stages];
    [newStages[index], newStages[swapIdx]] = [newStages[swapIdx], newStages[index]];
    setForm((prev) => ({ ...prev, stages: newStages }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setError("Pipeline name is required");
      return;
    }
    if (mode === "create" && form.stages.length === 0) {
      setError("Add at least one stage");
      return;
    }
    setError(null);
    onSubmit(form);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New Pipeline" : "Edit Pipeline"}
      className="max-w-lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm" role="alert">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="pl-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="pl-name"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="pl-desc" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            id="pl-desc"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>

        {/* Stage editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stages {mode === "create" && <span className="text-gray-400 font-normal">(drag to reorder)</span>}
          </label>
          {form.stages.length > 0 && (
            <ul className="space-y-1 mb-2">
              {form.stages.map((stage, idx) => (
                <li
                  key={`${stage}-${idx}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm"
                >
                  <span className="text-gray-400 text-xs w-4">{idx + 1}</span>
                  <span className="flex-1 text-gray-800">{stage}</span>
                  <div className="flex gap-1">
                    <button
                      className="text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30"
                      onClick={() => handleMoveStage(idx, "up")}
                      disabled={idx === 0}
                      aria-label={`Move ${stage} up`}
                    >
                      ↑
                    </button>
                    <button
                      className="text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30"
                      onClick={() => handleMoveStage(idx, "down")}
                      disabled={idx === form.stages.length - 1}
                      aria-label={`Move ${stage} down`}
                    >
                      ↓
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-500 text-xs ml-1"
                      onClick={() => handleRemoveStage(idx)}
                      aria-label={`Remove ${stage}`}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="New stage name"
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddStage();
                }
              }}
              aria-label="New stage name"
            />
            <Button size="sm" variant="secondary" onClick={handleAddStage}>
              Add
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {mode === "edit" && onDelete && (
              confirmDelete ? (
                <div className="flex gap-1">
                  <Button size="sm" variant="danger" onClick={onDelete}>
                    Confirm Delete
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
                  Delete Pipeline
                </Button>
              )
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>{mode === "create" ? "Create" : "Save"}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
