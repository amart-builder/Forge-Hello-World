"use client";

import { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export interface CompanyFormData {
  name: string;
  domain: string;
  website: string;
  linkedin: string;
  industry: string;
  description: string;
  location: string;
  notes: string;
  [key: string]: string;
}

interface CompanyFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyFormData) => void;
  initial?: Partial<CompanyFormData>;
  mode: "create" | "edit";
}

const EMPTY_FORM: CompanyFormData = {
  name: "",
  domain: "",
  website: "",
  linkedin: "",
  industry: "",
  description: "",
  location: "",
  notes: "",
};

export default function CompanyForm({
  open,
  onClose,
  onSubmit,
  initial,
  mode,
}: CompanyFormProps) {
  const initialForm = useMemo(() => {
    const merged = { ...EMPTY_FORM };
    if (initial) {
      for (const [key, value] of Object.entries(initial)) {
        if (value !== undefined) merged[key] = value;
      }
    }
    return merged;
  }, [initial]);

  const [form, setForm] = useState<CompanyFormData>(initialForm);
  const [error, setError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setForm(initialForm);
    setError(null);
  }
  if (open !== prevOpen) setPrevOpen(open);

  const updateField = (field: keyof CompanyFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    onSubmit(form);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === "create" ? "New Company" : "Edit Company"} className="max-w-lg">
      <div className="space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm" role="alert">{error}</div>
        )}

        <div>
          <label htmlFor="co-name" className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
          <input id="co-name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.name} onChange={(e) => updateField("name", e.target.value)} autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="co-domain" className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
            <input id="co-domain" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.domain} onChange={(e) => updateField("domain", e.target.value)} placeholder="acme.com" />
          </div>
          <div>
            <label htmlFor="co-website" className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input id="co-website" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.website} onChange={(e) => updateField("website", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="co-industry" className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <input id="co-industry" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.industry} onChange={(e) => updateField("industry", e.target.value)} />
          </div>
          <div>
            <label htmlFor="co-location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input id="co-location" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.location} onChange={(e) => updateField("location", e.target.value)} />
          </div>
        </div>

        <div>
          <label htmlFor="co-linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
          <input id="co-linkedin" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} />
        </div>

        <div>
          <label htmlFor="co-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea id="co-description" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[60px] resize-y" value={form.description} onChange={(e) => updateField("description", e.target.value)} />
        </div>

        <div>
          <label htmlFor="co-notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="co-notes" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[60px] resize-y" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{mode === "create" ? "Create" : "Save"}</Button>
        </div>
      </div>
    </Modal>
  );
}
