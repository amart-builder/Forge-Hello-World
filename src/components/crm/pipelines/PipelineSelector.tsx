"use client";

import Button from "@/components/ui/Button";

export interface PipelineSummary {
  _id: string;
  name: string;
  description?: string;
}

interface PipelineSelectorProps {
  pipelines: PipelineSummary[] | undefined;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewPipeline: () => void;
}

export default function PipelineSelector({
  pipelines,
  selectedId,
  onSelect,
  onNewPipeline,
}: PipelineSelectorProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
      <div className="flex items-center gap-1 flex-1 overflow-x-auto">
        {!pipelines ? (
          <span className="text-sm text-gray-400 animate-pulse">Loading...</span>
        ) : pipelines.length === 0 ? (
          <span className="text-sm text-gray-400">No pipelines yet</span>
        ) : (
          pipelines.map((pipeline) => (
            <button
              key={pipeline._id}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                pipeline._id === selectedId
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => onSelect(pipeline._id)}
              aria-pressed={pipeline._id === selectedId}
            >
              {pipeline.name}
            </button>
          ))
        )}
      </div>
      <Button size="sm" onClick={onNewPipeline}>
        + New Pipeline
      </Button>
    </div>
  );
}
