"use client";

import { cn } from "@/lib/utils";
import SearchInput from "@/components/ui/SearchInput";
import Button from "@/components/ui/Button";

export interface CompanyListItem {
  _id: string;
  name: string;
  domain?: string;
  industry?: string;
  tags: string[];
  lastInteractionAt?: number;
  linkedContactCount?: number;
}

interface CompanyListProps {
  companies: CompanyListItem[] | undefined;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  industryFilter: string;
  onIndustryFilterChange: (value: string) => void;
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  allIndustries: string[];
  allTags: string[];
}

export default function CompanyList({
  companies,
  selectedId,
  onSelect,
  onAdd,
  search,
  onSearchChange,
  industryFilter,
  onIndustryFilterChange,
  tagFilter,
  onTagFilterChange,
  allIndustries,
  allTags,
}: CompanyListProps) {
  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Companies
            {companies && (
              <span className="text-gray-400 font-normal ml-1">
                ({companies.length})
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
          placeholder="Search name, domain..."
        />

        <div className="flex gap-2">
          {allIndustries.length > 0 && (
            <select
              className="text-xs px-2 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={industryFilter}
              onChange={(e) => onIndustryFilterChange(e.target.value)}
              aria-label="Filter by industry"
            >
              <option value="">All industries</option>
              {allIndustries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          )}
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

      {/* Company list */}
      <div className="flex-1 overflow-y-auto">
        {!companies ? (
          <div className="py-8 text-center text-sm text-gray-400 animate-pulse">
            Loading...
          </div>
        ) : companies.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            {search || industryFilter || tagFilter
              ? "No companies match your filters."
              : "No companies yet. Add your first company."}
          </div>
        ) : (
          <ul role="listbox" aria-label="Company list">
            {companies.map((company) => (
              <li
                key={company._id}
                role="option"
                aria-selected={company._id === selectedId}
                className={cn(
                  "px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors",
                  company._id === selectedId && "bg-blue-50 hover:bg-blue-50"
                )}
                onClick={() => onSelect(company._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(company._id);
                  }
                }}
                tabIndex={0}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                    {company.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {company.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {[company.domain, company.industry].filter(Boolean).join(" · ")}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {company.linkedContactCount !== undefined && company.linkedContactCount > 0 && (
                        <span className="text-[10px] text-gray-400">
                          {company.linkedContactCount} contact{company.linkedContactCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {company.lastInteractionAt && (
                        <span className="text-[10px] text-gray-400">
                          Last: {new Date(company.lastInteractionAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      {company.tags.length > 0 && (
                        <span className="text-[10px] text-gray-400 truncate">
                          {company.tags.slice(0, 2).join(", ")}
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
