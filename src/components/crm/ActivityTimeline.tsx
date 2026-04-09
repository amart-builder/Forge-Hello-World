"use client";

import { relativeDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

export interface ActivityData {
  _id: string;
  contactId: string;
  activityType: string;
  title?: string;
  content?: string;
  direction?: "inbound" | "outbound" | "internal";
  createdAt: number;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  email_sent: { label: "Email Sent", icon: "→", color: "text-blue-500" },
  email_received: { label: "Email Received", icon: "←", color: "text-green-500" },
  meeting: { label: "Meeting", icon: "◉", color: "text-purple-500" },
  note: { label: "Note", icon: "✎", color: "text-gray-500" },
  call: { label: "Call", icon: "☏", color: "text-amber-500" },
  import: { label: "Imported", icon: "⬇", color: "text-gray-400" },
  status_change: { label: "Status Change", icon: "⟳", color: "text-orange-500" },
  relationship_update: { label: "Relationship Update", icon: "★", color: "text-yellow-500" },
};

interface ActivityTimelineProps {
  activities: ActivityData[] | undefined;
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (!activities) {
    return (
      <div className="py-4 text-center text-sm text-gray-400 animate-pulse">
        Loading activities...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, idx) => {
        const config = TYPE_CONFIG[activity.activityType] ?? {
          label: activity.activityType,
          icon: "•",
          color: "text-gray-400",
        };

        return (
          <div key={activity._id} className="flex gap-3 relative">
            {/* Timeline line */}
            {idx < activities.length - 1 && (
              <div className="absolute left-[11px] top-7 bottom-0 w-px bg-gray-200" />
            )}

            {/* Icon */}
            <div
              className={`w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${config.color}`}
              aria-hidden="true"
            >
              {config.icon}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900">
                  {activity.title ?? config.label}
                </span>
                <Badge variant="default">{config.label}</Badge>
                <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                  {relativeDate(activity.createdAt)}
                </span>
              </div>
              {activity.content && (
                <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                  {activity.content}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
