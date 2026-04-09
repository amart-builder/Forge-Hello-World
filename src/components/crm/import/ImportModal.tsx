"use client";

import { useState } from "react";
import CsvImporter from "./CsvImporter";
import AttioImporter from "./AttioImporter";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "csv" | "attio";

export default function ImportModal({ open, onClose }: ImportModalProps) {
  const [tab, setTab] = useState<Tab>("csv");

  // Reset tab when modal opens
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setTab("csv");
  }
  if (open !== prevOpen) {
    setPrevOpen(open);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Import data"
    >
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Import Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
            aria-label="Close import modal"
          >
            ×
          </button>
        </div>

        {/* Tab bar */}
        <div className="px-6 pt-3 flex gap-1">
          <button
            onClick={() => setTab("csv")}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              tab === "csv"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-pressed={tab === "csv"}
          >
            CSV
          </button>
          <button
            onClick={() => setTab("attio")}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              tab === "attio"
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-pressed={tab === "attio"}
          >
            Attio
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "csv" ? (
            <CsvImporter onComplete={onClose} />
          ) : (
            <AttioImporter onComplete={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
