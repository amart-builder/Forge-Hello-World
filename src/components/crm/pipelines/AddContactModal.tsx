"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";

export interface ContactOption {
  _id: string;
  name: string;
  email?: string;
  company?: string;
}

interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
  contacts: ContactOption[] | undefined;
  onAdd: (contactId: string) => void;
  pipelineName: string;
}

export default function AddContactModal({
  open,
  onClose,
  contacts,
  onAdd,
  pipelineName,
}: AddContactModalProps) {
  const [search, setSearch] = useState("");

  // prevOpen pattern
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setSearch("");
  }
  if (open !== prevOpen) setPrevOpen(open);

  const filtered = contacts?.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add Contact to ${pipelineName}`}
      className="max-w-md"
    >
      <div className="space-y-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Search contacts..."
        />

        <div className="max-h-64 overflow-y-auto">
          {!filtered ? (
            <p className="text-sm text-gray-400 text-center py-4 animate-pulse">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              {search ? "No contacts match your search." : "No contacts available."}
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((contact) => (
                <li key={contact._id}>
                  <button
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                    onClick={() => {
                      onAdd(contact._id);
                      onClose();
                    }}
                  >
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                      {contact.name
                        .split(/\s+/)
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {[contact.company, contact.email].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
