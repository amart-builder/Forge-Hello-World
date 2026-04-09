"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface PipelineEntryData {
  _id: string;
  pipelineId: string;
  stageId: string;
  contactId: string;
  position: number;
  enteredStageAt: number;
  notes?: string;
  contactName: string;
  contactEmail?: string;
  contactCompany?: string;
  contactLastInteractionAt?: number;
  createdAt: number;
  updatedAt: number;
}

interface PipelineCardProps {
  entry: PipelineEntryData;
  onClick: () => void;
}

function daysInStage(enteredStageAt: number): number {
  return Math.max(0, Math.floor((Date.now() - enteredStageAt) / (1000 * 60 * 60 * 24)));
}

export default function PipelineCard({ entry, onClick }: PipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const days = daysInStage(entry.enteredStageAt);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 cursor-pointer hover:shadow-sm transition-shadow"
      onClick={onClick}
      role="button"
      aria-label={`${entry.contactName} in pipeline`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
          {entry.contactName
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {entry.contactName}
          </p>
          {entry.contactCompany && (
            <p className="text-xs text-gray-500 truncate">
              {entry.contactCompany}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
        <span>{days}d in stage</span>
        {entry.contactLastInteractionAt && (
          <span>
            Last:{" "}
            {new Date(entry.contactLastInteractionAt).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric" }
            )}
          </span>
        )}
      </div>
    </div>
  );
}
