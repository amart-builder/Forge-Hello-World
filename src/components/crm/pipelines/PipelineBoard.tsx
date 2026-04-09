"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import StageColumn, { type StageData } from "./StageColumn";
import PipelineCard, { type PipelineEntryData } from "./PipelineCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Button from "@/components/ui/Button";

interface PipelineBoardProps {
  stages: StageData[] | undefined;
  entries: PipelineEntryData[] | undefined;
  onMoveEntry: (entryId: string, stageId: string, position: number) => void;
  onCardClick: (contactId: string) => void;
  onAddContact: () => void;
  onEditPipeline: () => void;
}

export default function PipelineBoard({
  stages,
  entries,
  onMoveEntry,
  onCardClick,
  onAddContact,
  onEditPipeline,
}: PipelineBoardProps) {
  const [activeEntry, setActiveEntry] = useState<PipelineEntryData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group entries by stage
  const entriesByStage = useMemo(() => {
    const map = new Map<string, PipelineEntryData[]>();
    if (stages) {
      for (const stage of stages) {
        map.set(stage._id, []);
      }
    }
    if (entries) {
      for (const entry of entries) {
        const arr = map.get(entry.stageId);
        if (arr) {
          arr.push(entry);
        }
      }
    }
    return map;
  }, [stages, entries]);

  const handleDragStart = (event: DragStartEvent) => {
    const entry = entries?.find((e) => e._id === event.active.id);
    if (entry) setActiveEntry(entry);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEntry(null);

    if (!over || !entries || !stages) return;

    const activeEntryId = active.id as string;
    const activeEntryData = entries.find((e) => e._id === activeEntryId);
    if (!activeEntryData) return;

    const overId = over.id as string;
    let targetStageId: string;
    let targetPosition: number;

    if (overId.startsWith("stage-")) {
      // Dropped on empty stage area
      targetStageId = overId.replace("stage-", "");
      const stageEntries = entriesByStage.get(targetStageId) ?? [];
      targetPosition =
        stageEntries.length > 0
          ? Math.max(...stageEntries.map((e) => e.position)) + 1.0
          : 1.0;
    } else {
      // Dropped on another entry
      const overEntry = entries.find((e) => e._id === overId);
      if (!overEntry) return;

      targetStageId = overEntry.stageId;
      const stageEntries = (entriesByStage.get(targetStageId) ?? [])
        .filter((e) => e._id !== activeEntryId)
        .sort((a, b) => a.position - b.position);

      const overIndex = stageEntries.findIndex((e) => e._id === overId);

      if (overIndex === 0) {
        targetPosition = stageEntries[0].position / 2;
      } else if (overIndex === stageEntries.length - 1) {
        targetPosition = stageEntries[overIndex].position + 1.0;
      } else {
        const before = stageEntries[overIndex - 1].position;
        const after = stageEntries[overIndex].position;
        targetPosition = (before + after) / 2;
      }
    }

    if (
      activeEntryData.stageId !== targetStageId ||
      activeEntryData.position !== targetPosition
    ) {
      onMoveEntry(activeEntryId, targetStageId, targetPosition);
    }
  };

  // Loading
  if (stages === undefined || entries === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // No stages
  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-sm text-gray-500 mb-3">This pipeline has no stages yet.</p>
        <Button size="sm" onClick={onEditPipeline}>
          Edit Pipeline
        </Button>
      </div>
    );
  }

  const sortedStages = [...stages].sort((a, b) => a.position - b.position);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto h-full px-4 py-3">
        {sortedStages.map((stage) => (
          <StageColumn
            key={stage._id}
            stage={stage}
            entries={entriesByStage.get(stage._id) ?? []}
            onCardClick={onCardClick}
          />
        ))}

        {/* Action bar */}
        <div className="flex-shrink-0 w-48 flex flex-col gap-2 pt-1">
          <Button size="sm" onClick={onAddContact}>
            + Add Contact
          </Button>
          <Button size="sm" variant="secondary" onClick={onEditPipeline}>
            Edit Pipeline
          </Button>
        </div>
      </div>

      <DragOverlay>
        {activeEntry ? (
          <div className="opacity-90 rotate-2">
            <PipelineCard entry={activeEntry} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
