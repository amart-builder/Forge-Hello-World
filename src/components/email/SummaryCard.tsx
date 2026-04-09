"use client";

interface SummaryCardProps {
  triageSummary: string | null;
  counts: { total: number; pending: number; actioned: number; dismissed: number } | undefined;
}

export default function SummaryCard({ triageSummary, counts }: SummaryCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-2">
        {triageSummary ? "Here\u2019s what happened since you last looked" : "Email Summary"}
      </h2>

      {counts ? (
        <div className="flex gap-6 mb-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            <p className="text-xs text-gray-500">processed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{counts.pending}</p>
            <p className="text-xs text-gray-500">need attention</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{counts.actioned}</p>
            <p className="text-xs text-gray-500">actioned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400">{counts.dismissed}</p>
            <p className="text-xs text-gray-500">dismissed</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-6 mb-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center animate-pulse">
              <div className="h-8 w-8 bg-gray-200 rounded mx-auto mb-1" />
              <div className="h-3 w-12 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {triageSummary ? (
        <p className="text-sm text-gray-600 leading-relaxed">{triageSummary}</p>
      ) : (
        <p className="text-sm text-gray-400 italic">
          No triage has run yet. Email summaries will appear here after the first triage.
        </p>
      )}
    </div>
  );
}
