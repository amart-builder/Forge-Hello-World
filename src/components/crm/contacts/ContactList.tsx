"use client";

import { cn } from "@/lib/utils";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export interface ContactListItem {
  _id: string;
  name: string;
  email?: string;
  company?: string;
  companyNameCached?: string;
  lastContactDate?: string;
  tier: string;
  tags: string[];
  status?: string;
}

const TIER_VARIANT: Record<string, "error" | "warning" | "default"> = {
  A: "error",
  B: "warning",
  C: "default",
};

interface ContactListProps {
  contacts: ContactListItem[] | undefined;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  tierFilter: string;
  onTierFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  allTags: string[];
}

export default function ContactList({
  contacts,
  selectedId,
  onSelect,
  onAdd,
  search,
  onSearchChange,
  tierFilter,
  onTierFilterChange,
  statusFilter,
  onStatusFilterChange,
  tagFilter,
  onTagFilterChange,
  allTags,
}: ContactListProps) {
  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Contacts
            {contacts && (
              <span className="text-gray-400 font-normal ml-1">
                ({contacts.length})
              </span>
            )}
          </h2>
          <Button size="sm" onClick={onAdd}>
            + Add
          </Button>
        </div>

        <SearchInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange("")}
          placeholder="Search name, email, company..."
        />

        <div className="flex gap-2">
          <select
            className="text-xs px-2 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={tierFilter}
            onChange={(e) => onTierFilterChange(e.target.value)}
            aria-label="Filter by tier"
          >
            <option value="">All tiers</option>
            <option value="A">Tier A</option>
            <option value="B">Tier B</option>
            <option value="C">Tier C</option>
          </select>
          <select
            className="text-xs px-2 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
            <option value="archived">Archived</option>
          </select>
          {allTags.length > 0 && (
            <select
              className="text-xs px-2 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={tagFilter}
              onChange={(e) => onTagFilterChange(e.target.value)}
              aria-label="Filter by tag"
            >
              <option value="">All tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {!contacts ? (
          <div className="py-8 text-center text-sm text-gray-400 animate-pulse">
            Loading...
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            {search || tierFilter || statusFilter || tagFilter
              ? "No contacts match your filters."
              : "No contacts yet. Add your first contact."}
          </div>
        ) : (
          <ul role="listbox" aria-label="Contact list">
            {contacts.map((contact) => (
              <li
                key={contact._id}
                role="option"
                aria-selected={contact._id === selectedId}
                className={cn(
                  "px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors",
                  contact._id === selectedId && "bg-blue-50 hover:bg-blue-50"
                )}
                onClick={() => onSelect(contact._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(contact._id);
                  }
                }}
                tabIndex={0}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                    {contact.name
                      .split(/\s+/)
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contact.name}
                      </p>
                      {contact.tier && contact.tier !== "untiered" && (
                        <Badge variant={TIER_VARIANT[contact.tier] ?? "default"}>
                          {contact.tier}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {contact.companyNameCached ?? contact.company ?? ""}{" "}
                      {contact.email ? `· ${contact.email}` : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {contact.lastContactDate && (
                        <span className="text-[10px] text-gray-400">
                          Last: {contact.lastContactDate}
                        </span>
                      )}
                      {contact.tags.length > 0 && (
                        <span className="text-[10px] text-gray-400 truncate">
                          {contact.tags.slice(0, 3).join(", ")}
                          {contact.tags.length > 3 ? ` +${contact.tags.length - 3}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
