"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Button from "@/components/ui/Button";

interface AttioImporterProps {
  onComplete: () => void;
}

interface AttioRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  linkedin?: string;
  location?: string;
}

type Stage = "input" | "fetching" | "preview" | "importing" | "done";

export default function AttioImporter({ onComplete }: AttioImporterProps) {
  const [stage, setStage] = useState<Stage>("input");
  const [apiKey, setApiKey] = useState(
    () => process.env.NEXT_PUBLIC_ATTIO_API_KEY ?? ""
  );
  const [records, setRecords] = useState<AttioRecord[]>([]);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importContacts = useMutation(api.importers.importContacts);

  const handleFetch = async () => {
    setError(null);
    if (!apiKey.trim()) {
      setError("Please provide an Attio API key.");
      return;
    }
    setStage("fetching");

    try {
      const response = await fetch("https://api.attio.com/v2/objects/people/records/query", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit: 500 }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          response.status === 401
            ? "Invalid API key. Please check your Attio API key and try again."
            : `Attio API error: ${response.status} — ${text.slice(0, 200)}`
        );
      }

      const data = await response.json();
      const fetched: AttioRecord[] = (data.data ?? []).map((record: Record<string, unknown>) => {
        const values = record.values as Record<string, Array<Record<string, unknown>>> | undefined;
        const getName = () => {
          const nameVal = values?.name?.[0];
          if (!nameVal) return "Unknown";
          const first = (nameVal.first_name as string) ?? "";
          const last = (nameVal.last_name as string) ?? "";
          return `${first} ${last}`.trim() || "Unknown";
        };
        const getFirst = (field: string) => {
          const arr = values?.[field];
          if (!arr || arr.length === 0) return undefined;
          const val = arr[0];
          return (val?.value as string) ?? (val?.original as string) ?? undefined;
        };

        return {
          id: (record.id as Record<string, string>)?.record_id ?? String(Math.random()),
          name: getName(),
          email: getFirst("email_addresses"),
          phone: getFirst("phone_numbers"),
          company: getFirst("company"),
          role: getFirst("job_title"),
          linkedin: getFirst("linkedin"),
          location: getFirst("primary_location"),
        };
      });

      if (fetched.length === 0) {
        setError("No people records found in your Attio workspace.");
        setStage("input");
        return;
      }

      setRecords(fetched);
      setStage("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch from Attio.");
      setStage("input");
    }
  };

  const handleImport = async () => {
    setStage("importing");
    setError(null);
    try {
      const contacts = records.map((r) => ({
        name: r.name,
        email: r.email || undefined,
        phone: r.phone || undefined,
        company: r.company || undefined,
        role: r.role || undefined,
        linkedin: r.linkedin || undefined,
        location: r.location || undefined,
        sourceSystem: "attio" as const,
        sourceId: r.id,
        sourcePayload: JSON.stringify(r),
      }));
      const res = await importContacts({ contacts } as never);
      const typedRes = res as { created: number; skipped: number; errors: string[] };
      setResult(typedRes);
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
      setStage("preview");
    }
  };

  if (stage === "input") {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="attio-key" className="block text-sm font-medium text-gray-700 mb-1">
            Attio API Key
          </label>
          <input
            id="attio-key"
            type="password"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="attio_..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-400">
            Find your API key at app.attio.com → Settings → API.
            {process.env.NEXT_PUBLIC_ATTIO_API_KEY
              ? " (Pre-filled from environment.)"
              : ""}
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button onClick={handleFetch}>Fetch Records</Button>
        </div>
      </div>
    );
  }

  if (stage === "fetching") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-400 animate-pulse">Fetching from Attio...</div>
      </div>
    );
  }

  if (stage === "preview") {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          {records.length} people found in Attio.
        </div>

        <div className="max-h-48 overflow-auto border border-gray-200 rounded-lg">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700">Name</th>
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700">Email</th>
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700">Company</th>
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700">Role</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 10).map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="px-3 py-1.5 text-gray-600">{r.name}</td>
                  <td className="px-3 py-1.5 text-gray-600 truncate max-w-[160px]">
                    {r.email ?? "—"}
                  </td>
                  <td className="px-3 py-1.5 text-gray-600">{r.company ?? "—"}</td>
                  <td className="px-3 py-1.5 text-gray-600">{r.role ?? "—"}</td>
                </tr>
              ))}
              {records.length > 10 && (
                <tr>
                  <td colSpan={4} className="px-3 py-1.5 text-gray-400 text-center">
                    ... and {records.length - 10} more
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-between">
          <button
            onClick={() => setStage("input")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <Button onClick={handleImport}>
            Import {records.length} Contact{records.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "importing") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-400 animate-pulse">Importing contacts...</div>
      </div>
    );
  }

  // done
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-700">
        <p className="font-semibold text-green-700 mb-2">Attio import complete!</p>
        <p>
          Created: {result?.created ?? 0} · Skipped (duplicates): {result?.skipped ?? 0}
        </p>
        {result?.errors && result.errors.length > 0 && (
          <div className="mt-2 text-red-600">
            <p className="font-medium">Errors:</p>
            <ul className="list-disc list-inside">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button onClick={onComplete}>Done</Button>
      </div>
    </div>
  );
}
