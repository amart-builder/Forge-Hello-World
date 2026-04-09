"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import PipelineCard, { type PipelineEntryData } from "./PipelineCard";

export interface StageData {
  _id: string;
  pipelineId: string;
  name: string;
  position: number;
  createdAt: number;
}

interface StageColumnProps {
  stage: StageData;
  entries: PipelineEntryData[];
  onCardClick: (contactId: string) => void;
}

export default function StageColumn({
  stage,
  entries,
  onCardClick,
}: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage._id}`,
  });

  const sortedEntries = [...entries].sort((a, b) => a.position - b.position);
  const entryIds = sortedEntries.map((e) => e._id);

  return (
    <div className="flex-shrink-0 w-64 flex flex-col bg-gray-50 rounded-xl">
      {/* Stage header */}
      <div className="px-3 py-2.5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {stage.name}
          </h3>
          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
            {entries.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px] transition-colors ${
          isOver ? "bg-blue-50/50" : ""
        }`}
      >
        <SortableContext items={entryIds} strategy={verticalListSortingStrategy}>
          {sortedEntries.map((entry) => (
            <PipelineCard
              key={entry._id}
              entry={entry}
              onClick={() => onCardClick(entry.contactId)}
            />
          ))}
        </SortableContext>

        {entries.length === 0 && !isOver && (
          <div className="text-center text-xs text-gray-400 py-6">
            Drop contacts here
          </div>
        )}
      </div>
    </div>
  );
}
