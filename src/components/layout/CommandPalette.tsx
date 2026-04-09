"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface ContactResult {
  _id: string;
  name: string;
  email?: string;
  company?: string;
}

interface CompanyResult {
  _id: string;
  name: string;
  domain?: string;
  industry?: string;
}

type Mode = "search" | "action" | "query";

interface Action {
  id: string;
  label: string;
  description: string;
  href: string;
}

const ACTIONS: Action[] = [
  {
    id: "add-contact",
    label: "Add Contact",
    description: "Create a new CRM contact",
    href: "/crm/contacts",
  },
  {
    id: "add-company",
    label: "Add Company",
    description: "Create a new CRM company",
    href: "/crm/companies",
  },
  {
    id: "create-pipeline",
    label: "Create Pipeline",
    description: "Set up a new sales pipeline",
    href: "/crm/pipelines",
  },
  {
    id: "view-tasks",
    label: "View Tasks",
    description: "Open the task board",
    href: "/tasks",
  },
  {
    id: "view-email",
    label: "View Email",
    description: "Open email triage",
    href: "/email",
  },
  {
    id: "view-analytics",
    label: "View Analytics",
    description: "Open pipeline analytics",
    href: "/crm/analytics",
  },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Determine mode from input
  const mode: Mode = input.startsWith(">")
    ? "action"
    : input.startsWith("?")
      ? "query"
      : "search";

  const searchTerm =
    mode === "action"
      ? input.slice(1).trim()
      : mode === "query"
        ? input.slice(1).trim()
        : input.trim();

  // Fetch contacts and companies for search mode
  const contactsRaw = useQuery(api.contacts.list, {});
  const companiesRaw = useQuery(api.companies.list, {});

  const contacts = contactsRaw as ContactResult[] | undefined;
  const companies = companiesRaw as CompanyResult[] | undefined;

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setInput("");
      setQueryResult(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Click outside to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        setOpen(false);
      }
    },
    []
  );

  // Search results
  const searchResults = (() => {
    if (mode !== "search" || !searchTerm) return { contacts: [], companies: [] };
    const q = searchTerm.toLowerCase();
    const filteredContacts = (contacts ?? [])
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.company && c.company.toLowerCase().includes(q))
      )
      .slice(0, 5);
    const filteredCompanies = (companies ?? [])
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.domain && c.domain.toLowerCase().includes(q))
      )
      .slice(0, 5);
    return { contacts: filteredContacts, companies: filteredCompanies };
  })();

  // Action results
  const actionResults = (() => {
    if (mode !== "action") return [];
    if (!searchTerm) return ACTIONS;
    const q = searchTerm.toLowerCase();
    return ACTIONS.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  })();

  // Handle query submission
  const handleQuerySubmit = async () => {
    if (mode !== "query" || !searchTerm) return;
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const siteUrl =
        process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
        process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".cloud", ".site") ||
        "";
      const response = await fetch(`${siteUrl}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchTerm }),
      });
      const data = await response.json();
      setQueryResult(data.result || "No result returned.");
    } catch {
      setQueryResult(
        "Query endpoint not available. Connect an AI agent to enable natural language queries."
      );
    } finally {
      setQueryLoading(false);
    }
  };

  const navigateTo = (href: string) => {
    setOpen(false);
    window.location.href = href;
  };

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Input */}
        <div className="px-4 py-3 border-b border-gray-100">
          <input
            ref={inputRef}
            className="w-full text-sm text-gray-900 placeholder-gray-400 outline-none"
            placeholder="Search contacts & companies... (> for actions, ? for query)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && mode === "query") {
                e.preventDefault();
                handleQuerySubmit();
              }
              if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            aria-label="Command palette input"
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {/* Search mode */}
          {mode === "search" && searchTerm && (
            <>
              {searchResults.contacts.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Contacts
                  </div>
                  {searchResults.contacts.map((c) => (
                    <button
                      key={c._id}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      onClick={() =>
                        navigateTo(`/crm/contacts?id=${c._id}`)
                      }
                    >
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                        {c.name
                          .split(/\s+/)
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {c.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {[c.company, c.email].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.companies.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Companies
                  </div>
                  {searchResults.companies.map((c) => (
                    <button
                      key={c._id}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      onClick={() =>
                        navigateTo(`/crm/companies?id=${c._id}`)
                      }
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {c.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {[c.domain, c.industry].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.contacts.length === 0 &&
                searchResults.companies.length === 0 && (
                  <div className="px-4 py-6 text-sm text-gray-400 text-center">
                    No results for &ldquo;{searchTerm}&rdquo;
                  </div>
                )}
            </>
          )}

          {/* Action mode */}
          {mode === "action" && (
            <>
              {actionResults.length > 0 ? (
                actionResults.map((action) => (
                  <button
                    key={action.id}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    onClick={() => navigateTo(action.href)}
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {action.description}
                    </p>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-gray-400 text-center">
                  No matching actions
                </div>
              )}
            </>
          )}

          {/* Query mode */}
          {mode === "query" && (
            <div className="px-4 py-3">
              {queryLoading ? (
                <p className="text-sm text-gray-400 animate-pulse">
                  Querying...
                </p>
              ) : queryResult ? (
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {queryResult}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Type your question and press Enter to query CRM data.
                </p>
              )}
            </div>
          )}

          {/* Empty state — no input */}
          {mode === "search" && !searchTerm && (
            <div className="px-4 py-4 text-xs text-gray-400 space-y-1">
              <p>Type to search contacts and companies</p>
              <p>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">
                  &gt;
                </kbd>{" "}
                for quick actions
              </p>
              <p>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">
                  ?
                </kbd>{" "}
                for natural language queries
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
          <span>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded">↵</kbd> select
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded">esc</kbd> close
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded">⌘K</kbd> toggle
          </span>
        </div>
      </div>
    </div>
  );
}
