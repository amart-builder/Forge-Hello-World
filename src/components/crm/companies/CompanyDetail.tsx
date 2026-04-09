"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ActivityTimeline, { type ActivityData } from "@/components/crm/ActivityTimeline";

export interface CompanyFullData {
  _id: string;
  name: string;
  domain?: string;
  website?: string;
  linkedin?: string;
  industry?: string;
  description?: string;
  location?: string;
  tags: string[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface LinkedContact {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  tier: string;
}

interface CompanyDetailProps {
  company: CompanyFullData;
  linkedContacts: LinkedContact[] | undefined;
  activities: ActivityData[] | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateTags: (tags: string[]) => void;
  onContactClick: (contactId: string) => void;
}

function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
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
        <span className="text-sm font-semibold text-gray-900">
          {title}
          {count !== undefined && (
            <span className="text-gray-400 font-normal ml-1">({count})</span>
          )}
        </span>
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

export default function CompanyDetail({
  company,
  linkedContacts,
  activities,
  onEdit,
  onDelete,
  onUpdateTags,
  onContactClick,
}: CompanyDetailProps) {
  const [tagInput, setTagInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !company.tags.includes(trimmed)) {
      onUpdateTags([...company.tags, trimmed]);
    }
    setTagInput("");
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 flex-shrink-0">
            {company.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{company.name}</h2>
            <p className="text-sm text-gray-500">
              {[company.domain, company.industry, company.location].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="secondary" onClick={onEdit}>Edit</Button>
            {confirmDelete ? (
              <div className="flex gap-1">
                <Button size="sm" variant="danger" onClick={onDelete}>Confirm</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>Delete</Button>
            )}
          </div>
        </div>

        {/* Quick info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              Website
            </a>
          )}
          {company.linkedin && (
            <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              LinkedIn
            </a>
          )}
        </div>

        {company.description && (
          <p className="text-sm text-gray-600 mt-2">{company.description}</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3 items-center">
          {company.tags.map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
              <button
                className="ml-1 text-gray-500 hover:text-gray-700"
                onClick={() => onUpdateTags(company.tags.filter((t) => t !== tag))}
                aria-label={`Remove tag ${tag}`}
              >
                x
              </button>
            </Badge>
          ))}
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

      {/* Linked Contacts */}
      <CollapsibleSection
        title="Linked Contacts"
        count={linkedContacts?.length}
        defaultOpen={true}
      >
        {!linkedContacts ? (
          <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
        ) : linkedContacts.length === 0 ? (
          <p className="text-sm text-gray-400">No contacts linked to this company.</p>
        ) : (
          <ul className="space-y-1">
            {linkedContacts.map((contact) => (
              <li key={contact._id}>
                <button
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                  onClick={() => onContactClick(contact._id)}
                >
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                    {contact.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {[contact.role, contact.email].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {contact.tier && contact.tier !== "untiered" && (
                    <Badge variant="default">{contact.tier}</Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      {/* Activity Timeline (aggregated) */}
      <CollapsibleSection title="Activity Timeline">
        <ActivityTimeline activities={activities} />
      </CollapsibleSection>

      {/* Notes */}
      <CollapsibleSection title="Notes">
        {company.notes ? (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{company.notes}</p>
        ) : (
          <p className="text-sm text-gray-400">No notes yet.</p>
        )}
      </CollapsibleSection>

      {/* Details */}
      <CollapsibleSection title="Details">
        <div className="space-y-2 text-sm">
          {company.domain && (
            <div className="flex justify-between">
              <span className="text-gray-500">Domain</span>
              <span className="text-gray-900">{company.domain}</span>
            </div>
          )}
          {company.website && (
            <div className="flex justify-between">
              <span className="text-gray-500">Website</span>
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate ml-4">{company.website}</a>
            </div>
          )}
          {company.industry && (
            <div className="flex justify-between">
              <span className="text-gray-500">Industry</span>
              <span className="text-gray-900">{company.industry}</span>
            </div>
          )}
          {company.location && (
            <div className="flex justify-between">
              <span className="text-gray-500">Location</span>
              <span className="text-gray-900">{company.location}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Created</span>
            <span className="text-gray-900">{new Date(company.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
