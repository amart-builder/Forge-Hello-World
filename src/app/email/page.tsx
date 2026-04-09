"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import SummaryCard from "@/components/email/SummaryCard";
import ActionCard, { type EmailItemData } from "@/components/email/ActionCard";
import ActionLog, { type EmailActionData } from "@/components/email/ActionLog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

export default function EmailPage() {
  const emailsRaw = useQuery(api.emails.list, { status: "pending" });
  const countsRaw = useQuery(api.emails.counts);
  const actionsRaw = useQuery(api.emailActions.list, {});
  const triageSummaryRaw = useQuery(api.appState.get, {
    key: "triage_summary",
  });

  const updateStatus = useMutation(api.emails.updateStatus);
  const updateDraft = useMutation(api.emails.updateDraft);
  const createAction = useMutation(api.emailActions.create);
  const { showToast } = useToast();

  const emails = emailsRaw as EmailItemData[] | undefined;
  const counts = countsRaw as
    | { total: number; pending: number; actioned: number; dismissed: number }
    | undefined;
  const actions = actionsRaw as EmailActionData[] | undefined;
  const triageSummary = (triageSummaryRaw as { value?: string } | null)?.value ?? null;

  const handleAction = async (emailId: string, action: string) => {
    try {
      await updateStatus({
        id: emailId as never,
        status: "actioned" as never,
      });
      await createAction({
        emailItemId: emailId as never,
        actionType: action,
        performedBy: "user" as never,
        description: `${action} action taken`,
      });
    } catch {
      showToast("Failed to action email. Please try again.");
    }
  };

  const handleDismiss = async (emailId: string) => {
    try {
      await updateStatus({
        id: emailId as never,
        status: "dismissed" as never,
      });
      await createAction({
        emailItemId: emailId as never,
        actionType: "dismiss",
        performedBy: "user" as never,
        description: "Dismissed by user",
      });
    } catch {
      showToast("Failed to dismiss email. Please try again.");
    }
  };

  const handleUpdateDraft = async (emailId: string, draft: string) => {
    try {
      await updateDraft({
        id: emailId as never,
        draftResponse: draft,
      });
    } catch {
      showToast("Failed to save draft. Please try again.");
    }
  };

  const isLoading = emails === undefined;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 overflow-y-auto h-full">
      {/* Summary Card */}
      <SummaryCard triageSummary={triageSummary} counts={counts} />

      {/* Action Cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Needs Attention
        </h2>

        {isLoading ? (
          <LoadingSpinner className="py-12" />
        ) : emails.length === 0 ? (
          <EmptyState
            title="Inbox zero"
            description="No emails need your attention right now. Nice work."
          />
        ) : (
          <div className="space-y-3">
            {emails.map((email) => (
              <ActionCard
                key={email._id}
                email={email}
                onAction={handleAction}
                onDismiss={handleDismiss}
                onUpdateDraft={handleUpdateDraft}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Log */}
      <ActionLog actions={actions} />
    </div>
  );
}
