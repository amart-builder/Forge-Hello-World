"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import PipelineBreakdownChart, {
  type StageCount,
} from "@/components/crm/analytics/PipelineBreakdownChart";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface PipelineOption {
  _id: string;
  name: string;
}

interface StageRaw {
  _id: string;
  name: string;
  position: number;
}

interface EntryRaw {
  stageId: string;
}

export default function AnalyticsPage() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(
    null
  );

  const pipelinesRaw = useQuery(api.pipelines.list, {});
  const pipelines = pipelinesRaw as PipelineOption[] | undefined;

  // Auto-select first pipeline
  if (pipelines && pipelines.length > 0 && !selectedPipelineId) {
    setSelectedPipelineId(pipelines[0]._id);
  }

  const stagesRaw = useQuery(
    api.pipelineStages.list,
    selectedPipelineId
      ? { pipelineId: selectedPipelineId as never }
      : "skip"
  );
  const entriesRaw = useQuery(
    api.pipelineEntries.listByPipeline,
    selectedPipelineId
      ? { pipelineId: selectedPipelineId as never }
      : "skip"
  );

  const stages = stagesRaw as StageRaw[] | undefined;
  const entries = entriesRaw as EntryRaw[] | undefined;

  const selectedPipeline = pipelines?.find(
    (p) => p._id === selectedPipelineId
  );

  // Compute stage counts
  const chartData: StageCount[] = (() => {
    if (!stages || !entries) return [];
    const sorted = [...stages].sort((a, b) => a.position - b.position);
    return sorted.map((stage) => ({
      name: stage.name,
      count: entries.filter((e) => e.stageId === stage._id).length,
    }));
  })();

  // Loading
  if (pipelines === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // No pipelines
  if (pipelines.length === 0) {
    return (
      <EmptyState
        title="No pipelines yet"
        description="Create a pipeline in the Pipelines tab to see analytics here."
        className="h-full"
      />
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Pipeline selector */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="analytics-pipeline-select"
          className="text-sm font-medium text-gray-700"
        >
          Pipeline
        </label>
        <select
          id="analytics-pipeline-select"
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
          value={selectedPipelineId ?? ""}
          onChange={(e) => setSelectedPipelineId(e.target.value)}
          aria-label="Select pipeline for analytics"
        >
          {pipelines.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Chart card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {stages === undefined || entries === undefined ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <PipelineBreakdownChart
            data={chartData}
            pipelineName={selectedPipeline?.name ?? ""}
          />
        )}
      </div>
    </div>
  );
}
