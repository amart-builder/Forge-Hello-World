"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { relativeDate } from "@/lib/utils";

export interface EmailActionData {
  _id: string;
  emailItemId: string;
  actionType: string;
  description?: string;
  createdAt: number;
  performedBy?: "user" | "agent" | "system";
}

const ACTION_TYPE_OPTIONS = [
  "all",
  "reply",
  "archive",
  "follow_up",
  "delegate",
  "flag",
  "review",
  "dismiss",
  "auto_archive",
  "auto_label",
] as const;

const PERFORMER_LABELS: Record<string, string> = {
  user: "You",
  agent: "Agent",
  system: "System",
};

interface ActionLogProps {
  actions: EmailActionData[] | undefined;
}

export default function ActionLog({ actions }: ActionLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const filteredActions =
    actions?.filter((a) => filter === "all" || a.actionType === filter) ?? [];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Collapsible header */}
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="action-log-content"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Action Log</h3>
          <span className="text-xs text-gray-400">
            {actions ? `${actions.length} entries` : "Loading..."}
          </span>
        </div>
        <svg
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {isOpen && (
        <div id="action-log-content" className="border-t border-gray-100">
          {/* Filter bar */}
          <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
            <label htmlFor="action-log-filter" className="sr-only">
              Filter by action type
            </label>
            <select
              id="action-log-filter"
              className="text-xs px-2 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {ACTION_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "all"
                    ? "All actions"
                    : opt.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Action list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredActions.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">
                {actions && actions.length > 0
                  ? "No actions match this filter."
                  : "No actions recorded yet."}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredActions.map((action) => (
                  <li
                    key={action._id}
                    className="px-5 py-2.5 flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">
                          {action.actionType.replace(/_/g, " ")}
                        </span>
                        {action.description && (
                          <span className="text-gray-500">
                            {" "}&mdash; {action.description}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {PERFORMER_LABELS[action.performedBy ?? "system"] ??
                          action.performedBy}{" "}
                        &middot; {relativeDate(action.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
