"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ActivityTimeline, { type ActivityData } from "@/components/crm/ActivityTimeline";

export interface ContactFullData {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  companyNameCached?: string;
  role?: string;
  linkedin?: string;
  location?: string;
  tier: string;
  tags: string[];
  howWeMet?: string;
  notes: string;
  status?: string;
  lastContactDate?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MeetingNoteData {
  _id: string;
  title?: string;
  date?: string;
  attendees: string[];
  summary?: string;
  actionItems: string[];
  createdAt: number;
}

const STATUS_VARIANT: Record<string, "success" | "info" | "warning" | "error" | "default"> = {
  lead: "info",
  active: "success",
  warm: "warning",
  cold: "default",
  archived: "error",
};

interface ContactDetailProps {
  contact: ContactFullData;
  activities: ActivityData[] | undefined;
  meetingNotes: MeetingNoteData[] | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateTags: (tags: string[]) => void;
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        <svg
          className={cn("w-4 h-4 text-gray-400 transition-transform", open && "rotate-180")}
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function DetailRow({
  label,
  value,
  isLink = false,
}: {
  label: string;
  value?: string;
  isLink?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline truncate ml-4"
        >
          {value}
        </a>
      ) : (
        <span className="text-gray-900 truncate ml-4">{value}</span>
      )}
    </div>
  );
}

export default function ContactDetail({
  contact,
  activities,
  meetingNotes,
  onEdit,
  onDelete,
  onUpdateTags,
}: ContactDetailProps) {
  const [tagInput, setTagInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const initials = contact.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Simple hash for avatar color
  const colorIdx = contact.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 6;
  const avatarColors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
  ];

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !contact.tags.includes(trimmed)) {
      onUpdateTags([...contact.tags, trimmed]);
    }
    setTagInput("");
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0",
              avatarColors[colorIdx]
            )}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{contact.name}</h2>
            <p className="text-sm text-gray-500">
              {[contact.role, contact.companyNameCached ?? contact.company]
                .filter(Boolean)
                .join(" at ")}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="secondary" onClick={onEdit}>
              Edit
            </Button>
            {confirmDelete ? (
              <div className="flex gap-1">
                <Button size="sm" variant="danger" onClick={onDelete}>
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Quick info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>{contact.phone}</span>}
          {contact.linkedin && (
            <a
              href={contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              LinkedIn
            </a>
          )}
          {contact.location && <span>{contact.location}</span>}
        </div>

        {/* Badges */}
        <div className="flex gap-2 mt-3">
          {contact.status && (
            <Badge variant={STATUS_VARIANT[contact.status] ?? "default"}>
              {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
            </Badge>
          )}
          {contact.tier && contact.tier !== "untiered" && (
            <Badge variant="warning">Tier {contact.tier}</Badge>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3 items-center">
          {contact.tags.map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
              <button
                className="ml-1 text-gray-500 hover:text-gray-700"
                onClick={() => onUpdateTags(contact.tags.filter((t) => t !== tag))}
                aria-label={`Remove tag ${tag}`}
              >
                x
              </button>
            </Badge>
          ))}
          <div className="flex gap-1">
            <input
              className="px-2 py-0.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300 w-20"
              placeholder="Add tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              aria-label="Add tag"
            />
          </div>
        </div>

        {/* How we met */}
        {contact.howWeMet && (
          <p className="text-xs text-gray-500 mt-2 italic">
            How we met: {contact.howWeMet}
          </p>
        )}
      </div>

      {/* Collapsible sections */}
      <CollapsibleSection title="Activity Timeline" defaultOpen={true}>
        <ActivityTimeline activities={activities} />
      </CollapsibleSection>

      <CollapsibleSection title="Meeting Notes">
        {!meetingNotes ? (
          <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
        ) : meetingNotes.length === 0 ? (
          <p className="text-sm text-gray-400">No meeting notes yet.</p>
        ) : (
          <div className="space-y-3">
            {meetingNotes.map((note) => (
              <div key={note._id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {note.title ?? "Meeting Note"}
                  </p>
                  {note.date && (
                    <span className="text-xs text-gray-400">{note.date}</span>
                  )}
                </div>
                {note.attendees.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Attendees: {note.attendees.join(", ")}
                  </p>
                )}
                {note.summary && (
                  <p className="text-sm text-gray-600 mt-1">{note.summary}</p>
                )}
                {note.actionItems.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {note.actionItems.map((item, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-gray-300 mt-0.5">☐</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Notes">
        {contact.notes ? (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
        ) : (
          <p className="text-sm text-gray-400">No notes yet.</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Details">
        <div className="space-y-2 text-sm">
          <DetailRow label="Email" value={contact.email} />
          <DetailRow label="Phone" value={contact.phone} />
          <DetailRow label="Company" value={contact.companyNameCached ?? contact.company} />
          <DetailRow label="Role" value={contact.role} />
          <DetailRow label="LinkedIn" value={contact.linkedin} isLink />
          <DetailRow label="Location" value={contact.location} />
          <DetailRow label="Tier" value={contact.tier} />
          <DetailRow label="Status" value={contact.status} />
          <DetailRow label="How we met" value={contact.howWeMet} />
          <DetailRow label="Last contact" value={contact.lastContactDate} />
          <DetailRow
            label="Created"
            value={new Date(contact.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          />
          <DetailRow
            label="Updated"
            value={new Date(contact.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}
