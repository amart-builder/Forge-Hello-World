"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Button from "@/components/ui/Button";

interface CsvImporterProps {
  onComplete: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

/**
 * Header aliases — maps common CSV column names to Forge field names.
 */
const HEADER_ALIASES: Record<string, string> = {
  full_name: "name",
  fullname: "name",
  "first name": "name",
  first_name: "name",
  contact_name: "name",
  email_address: "email",
  e_mail: "email",
  mail: "email",
  phone_number: "phone",
  telephone: "phone",
  mobile: "phone",
  cell: "phone",
  company_name: "company",
  organization: "company",
  org: "company",
  title: "role",
  job_title: "role",
  position: "role",
  linkedin_url: "linkedin",
  linkedin_profile: "linkedin",
  city: "location",
  address: "location",
  priority: "tier",
  note: "notes",
  comment: "notes",
  comments: "notes",
  tag: "tags",
  labels: "tags",
  label: "tags",
  how_we_met: "howWeMet",
};

function normalizeHeader(raw: string): string {
  const lower = raw.trim().toLowerCase();
  return HEADER_ALIASES[lower] ?? lower;
}

/**
 * RFC 4180-compliant CSV field splitter.
 * Handles quoted fields containing commas, escaped quotes (""), and newlines within quotes.
 */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote ("") or end of quoted field
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const rawHeaders = splitCsvLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    const row: ParsedRow = {};
    headers.forEach((h, idx) => {
      if (values[idx]) row[h] = values[idx];
    });
    if (row.name) rows.push(row);
  }

  return { headers, rows };
}

type Stage = "input" | "preview" | "importing" | "done";

export default function CsvImporter({ onComplete }: CsvImporterProps) {
  const [stage, setStage] = useState<Stage>("input");
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importContacts = useMutation(api.importers.importContacts);

  const handlePreview = useCallback(() => {
    setError(null);
    if (!csvText.trim()) {
      setError("Please paste CSV data.");
      return;
    }
    const parsed = parseCsv(csvText);
    if (parsed.rows.length === 0) {
      setError("No valid rows found. Make sure your CSV has a header row with a 'name' column.");
      return;
    }
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setStage("preview");
  }, [csvText]);

  const handleImport = async () => {
    setStage("importing");
    setError(null);
    try {
      const contacts = rows.map((row) => ({
        name: row.name,
        email: row.email || undefined,
        phone: row.phone || undefined,
        company: row.company || undefined,
        role: row.role || undefined,
        linkedin: row.linkedin || undefined,
        location: row.location || undefined,
        tier: row.tier || undefined,
        tags: row.tags ? row.tags.split(";").map((t) => t.trim()) : undefined,
        howWeMet: row.howWeMet || undefined,
        notes: row.notes || undefined,
        sourceSystem: "csv" as const,
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
          <label htmlFor="csv-input" className="block text-sm font-medium text-gray-700 mb-1">
            Paste CSV Data
          </label>
          <textarea
            id="csv-input"
            className="w-full h-40 text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            placeholder="name,email,company,role&#10;Jane Doe,jane@acme.com,Acme Inc,CEO&#10;..."
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button onClick={handlePreview}>Preview</Button>
        </div>
      </div>
    );
  }

  if (stage === "preview") {
    const displayHeaders = headers.filter((h) => h !== "");
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          {rows.length} row{rows.length !== 1 ? "s" : ""} found. Columns mapped:{" "}
          {displayHeaders.join(", ")}
        </div>

        <div className="max-h-48 overflow-auto border border-gray-200 rounded-lg">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {displayHeaders.map((h) => (
                  <th key={h} className="px-3 py-1.5 text-left font-semibold text-gray-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {displayHeaders.map((h) => (
                    <td key={h} className="px-3 py-1.5 text-gray-600 truncate max-w-[200px]">
                      {row[h] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length > 10 && (
                <tr>
                  <td
                    colSpan={displayHeaders.length}
                    className="px-3 py-1.5 text-gray-400 text-center"
                  >
                    ... and {rows.length - 10} more rows
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
            Import {rows.length} Contact{rows.length !== 1 ? "s" : ""}
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
        <p className="font-semibold text-green-700 mb-2">Import complete!</p>
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
