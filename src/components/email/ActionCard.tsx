"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { relativeDate } from "@/lib/utils";

export interface EmailItemData {
  _id: string;
  senderName?: string;
  senderEmail?: string;
  subject?: string;
  summary?: string;
  context?: string;
  recommendedAction: "reply" | "archive" | "follow_up" | "delegate" | "flag" | "review";
  draftResponse?: string;
  priority: number;
  status: "pending" | "actioned" | "dismissed";
  createdAt: number;
  gmailThreadUrl?: string;
  contactId?: string;
  companyId?: string;
}

const ACTION_LABELS: Record<string, string> = {
  reply: "Reply",
  archive: "Archive",
  follow_up: "Follow Up",
  delegate: "Delegate",
  flag: "Flag",
  review: "Review",
};

const ACTION_BADGE_VARIANT: Record<string, "info" | "default" | "warning" | "error" | "success"> = {
  reply: "info",
  archive: "default",
  follow_up: "warning",
  delegate: "default",
  flag: "error",
  review: "warning",
};

const PRIORITY_BORDER: Record<number, string> = {
  1: "border-l-red-500",
  2: "border-l-amber-400",
  3: "border-l-gray-300",
};

interface ActionCardProps {
  email: EmailItemData;
  onAction: (emailId: string, action: string) => void;
  onDismiss: (emailId: string) => void;
  onUpdateDraft: (emailId: string, draft: string) => void;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

export default function ActionCard({
  email,
  onAction,
  onDismiss,
  onUpdateDraft,
}: ActionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(email.draftResponse ?? "");

  const isReply = email.recommendedAction === "reply";
  const priorityBorder = PRIORITY_BORDER[email.priority] ?? "border-l-gray-300";

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-xl shadow-sm border-l-4 overflow-hidden",
        priorityBorder
      )}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0"
            aria-hidden="true"
          >
            {getInitials(email.senderName, email.senderEmail)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900 truncate">
                {email.senderName ?? "Unknown"}
              </span>
              {email.senderEmail && (
                <span className="text-xs text-gray-400 truncate">
                  {email.senderEmail}
                </span>
              )}
              <Badge variant={ACTION_BADGE_VARIANT[email.recommendedAction]}>
                {ACTION_LABELS[email.recommendedAction]}
              </Badge>
            </div>

            <p className="text-sm font-medium text-gray-800 mt-0.5 line-clamp-1">
              {email.subject ?? "(no subject)"}
            </p>

            {email.context && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {email.context}
              </p>
            )}
          </div>

          <span className="text-xs text-gray-400 flex-shrink-0">
            {relativeDate(email.createdAt)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          {isReply ? (
            <>
              <Button
                size="sm"
                variant={expanded ? "secondary" : "primary"}
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-controls={`draft-${email._id}`}
              >
                {expanded ? "Hide Draft" : "View Draft"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDismiss(email._id)}
              >
                Dismiss
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => onAction(email._id, email.recommendedAction)}
              >
                {ACTION_LABELS[email.recommendedAction]}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDismiss(email._id)}
              >
                Dismiss
              </Button>
            </>
          )}

          {email.gmailThreadUrl && (
            <a
              href={email.gmailThreadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 ml-auto"
              aria-label="Open in Gmail"
            >
              Open in Gmail &rarr;
            </a>
          )}
        </div>
      </div>

      {/* Expandable draft area for reply actions */}
      {isReply && expanded && (
        <div
          id={`draft-${email._id}`}
          className="border-t border-gray-100 bg-gray-50 p-4"
        >
          {editing ? (
            <div className="space-y-2">
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[120px] resize-y bg-white"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                aria-label="Edit draft response"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onUpdateDraft(email._id, draftText);
                    setEditing(false);
                  }}
                >
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraftText(email.draftResponse ?? "");
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {email.draftResponse ?? "No draft response available."}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => onAction(email._id, "reply")}
                >
                  Send Reply
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
