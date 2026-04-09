"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import PipelineSelector, { type PipelineSummary } from "@/components/crm/pipelines/PipelineSelector";
import PipelineBoard from "@/components/crm/pipelines/PipelineBoard";
import PipelineForm, { type PipelineFormData } from "@/components/crm/pipelines/PipelineForm";
import AddContactModal, { type ContactOption } from "@/components/crm/pipelines/AddContactModal";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { StageData } from "@/components/crm/pipelines/StageColumn";
import type { PipelineEntryData } from "@/components/crm/pipelines/PipelineCard";

export default function PipelinesPage() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);

  // Queries
  const pipelinesRaw = useQuery(api.pipelines.list, {});
  const stagesRaw = useQuery(
    api.pipelineStages.list,
    selectedPipelineId ? { pipelineId: selectedPipelineId as never } : "skip"
  );
  const entriesRaw = useQuery(
    api.pipelineEntries.listByPipeline,
    selectedPipelineId ? { pipelineId: selectedPipelineId as never } : "skip"
  );
  const contactsRaw = useQuery(api.contacts.list, {});

  const { showToast } = useToast();

  // Mutations
  const createPipeline = useMutation(api.pipelines.create);
  const updatePipeline = useMutation(api.pipelines.update);
  const deletePipeline = useMutation(api.pipelines.remove);
  const createStage = useMutation(api.pipelineStages.create);
  const removeStage = useMutation(api.pipelineStages.remove);
  const createEntry = useMutation(api.pipelineEntries.create);
  const moveEntry = useMutation(api.pipelineEntries.move);

  const pipelines = pipelinesRaw as PipelineSummary[] | undefined;
  const stages = stagesRaw as StageData[] | undefined;
  const entries = entriesRaw as PipelineEntryData[] | undefined;
  const contacts = contactsRaw as ContactOption[] | undefined;

  // Auto-select first pipeline
  if (pipelines && pipelines.length > 0 && !selectedPipelineId) {
    setSelectedPipelineId(pipelines[0]._id);
  }

  const selectedPipeline = pipelines?.find((p) => p._id === selectedPipelineId);

  const handleCreatePipeline = async (data: PipelineFormData) => {
    try {
      const pipelineId = await createPipeline({
        name: data.name,
        description: data.description || undefined,
      });
      // Create stages in order
      for (let i = 0; i < data.stages.length; i++) {
        await createStage({
          pipelineId: pipelineId as never,
          name: data.stages[i],
        });
      }
      setSelectedPipelineId(pipelineId as unknown as string);
    } catch {
      showToast("Failed to create pipeline. Please try again.");
    }
  };

  const handleEditPipeline = async (data: PipelineFormData) => {
    if (!selectedPipelineId || !stages) return;
    try {
      await updatePipeline({
        id: selectedPipelineId as never,
        name: data.name,
        description: data.description || undefined,
      });

      // Sync stages: compare existing vs new
      const newNames = data.stages;

      // Remove stages that are no longer in the list
      for (const stage of stages) {
        if (!newNames.includes(stage.name)) {
          await removeStage({ id: stage._id as never });
        }
      }

      // Rename stages that changed position but keep the same name
      // Add new stages
      for (let i = 0; i < newNames.length; i++) {
        const existingStage = stages.find((s) => s.name === newNames[i]);
        if (!existingStage) {
          // New stage
          await createStage({
            pipelineId: selectedPipelineId as never,
            name: newNames[i],
          });
        }
      }

      setEditMode(false);
    } catch {
      showToast("Failed to update pipeline. Please try again.");
    }
  };

  const handleDeletePipeline = async () => {
    if (!selectedPipelineId) return;
    try {
      await deletePipeline({ id: selectedPipelineId as never });
      setSelectedPipelineId(null);
      setFormOpen(false);
      setEditMode(false);
    } catch {
      showToast("Failed to delete pipeline. Please try again.");
    }
  };

  const handleMoveEntry = async (entryId: string, stageId: string, position: number) => {
    try {
      await moveEntry({
        id: entryId as never,
        stageId: stageId as never,
        position,
      });
    } catch {
      showToast("Failed to move entry. Please try again.");
    }
  };

  const handleAddContact = async (contactId: string) => {
    if (!selectedPipelineId || !stages || stages.length === 0) return;
    try {
      // Add to first stage
      const firstStage = [...stages].sort((a, b) => a.position - b.position)[0];
      await createEntry({
        pipelineId: selectedPipelineId as never,
        stageId: firstStage._id as never,
        contactId: contactId as never,
      });
    } catch {
      showToast("Failed to add contact to pipeline. Please try again.");
    }
  };

  const handleContactClick = (contactId: string) => {
    window.location.href = `/crm/contacts?id=${contactId}`;
  };

  // Get existing form data for editing
  const editFormInitial = editMode && selectedPipeline && stages
    ? {
        name: selectedPipeline.name,
        description: selectedPipeline.description ?? "",
        stages: [...stages].sort((a, b) => a.position - b.position).map((s) => s.name),
      }
    : undefined;

  return (
    <div className="flex flex-col h-full">
      <PipelineSelector
        pipelines={pipelines}
        selectedId={selectedPipelineId}
        onSelect={setSelectedPipelineId}
        onNewPipeline={() => {
          setEditMode(false);
          setFormOpen(true);
        }}
      />

      <div className="flex-1 min-h-0">
        {!selectedPipelineId ? (
          <EmptyState
            title="No pipeline selected"
            description="Create your first pipeline to start tracking contacts through stages."
            action={
              <Button onClick={() => { setEditMode(false); setFormOpen(true); }}>
                + New Pipeline
              </Button>
            }
            className="h-full"
          />
        ) : (
          <PipelineBoard
            stages={stages}
            entries={entries}
            onMoveEntry={handleMoveEntry}
            onCardClick={handleContactClick}
            onAddContact={() => setAddContactOpen(true)}
            onEditPipeline={() => {
              setEditMode(true);
              setFormOpen(true);
            }}
          />
        )}
      </div>

      <PipelineForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditMode(false);
        }}
        onSubmit={editMode ? handleEditPipeline : handleCreatePipeline}
        onDelete={editMode ? handleDeletePipeline : undefined}
        mode={editMode ? "edit" : "create"}
        initial={editFormInitial}
      />

      <AddContactModal
        open={addContactOpen}
        onClose={() => setAddContactOpen(false)}
        contacts={contacts}
        onAdd={handleAddContact}
        pipelineName={selectedPipeline?.name ?? "Pipeline"}
      />
    </div>
  );
}
