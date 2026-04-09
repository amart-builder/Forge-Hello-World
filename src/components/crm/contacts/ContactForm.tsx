"use client";

import { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  linkedin: string;
  location: string;
  tier: string;
  status: string;
  howWeMet: string;
  notes: string;
  [key: string]: string;
}

interface ContactFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => void;
  initial?: Partial<ContactFormData>;
  mode: "create" | "edit";
}

const EMPTY_FORM: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  role: "",
  linkedin: "",
  location: "",
  tier: "C",
  status: "lead",
  howWeMet: "",
  notes: "",
};

export default function ContactForm({
  open,
  onClose,
  onSubmit,
  initial,
  mode,
}: ContactFormProps) {
  const initialForm = useMemo(() => {
    const merged = { ...EMPTY_FORM };
    if (initial) {
      for (const [key, value] of Object.entries(initial)) {
        if (value !== undefined) {
          merged[key] = value;
        }
      }
    }
    return merged;
  }, [initial]);

  const [form, setForm] = useState<ContactFormData>(initialForm);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens with new initial data
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setForm(initialForm);
    setError(null);
  }
  if (open !== prevOpen) {
    setPrevOpen(open);
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    onSubmit(form);
    onClose();
  };

  const updateField = (field: keyof ContactFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New Contact" : "Edit Contact"}
      className="max-w-lg"
    >
      <div className="space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm" role="alert">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="cf-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="cf-name"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cf-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="cf-email" type="email" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
          </div>
          <div>
            <label htmlFor="cf-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input id="cf-phone" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cf-company" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input id="cf-company" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.company} onChange={(e) => updateField("company", e.target.value)} />
          </div>
          <div>
            <label htmlFor="cf-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input id="cf-role" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.role} onChange={(e) => updateField("role", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cf-linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
            <input id="cf-linkedin" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} />
          </div>
          <div>
            <label htmlFor="cf-location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input id="cf-location" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.location} onChange={(e) => updateField("location", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cf-tier" className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
            <select id="cf-tier" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.tier} onChange={(e) => updateField("tier", e.target.value)}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
          <div>
            <label htmlFor="cf-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="cf-status" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.status} onChange={(e) => updateField("status", e.target.value)}>
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="cf-howwemet" className="block text-sm font-medium text-gray-700 mb-1">How we met</label>
          <input id="cf-howwemet" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" value={form.howWeMet} onChange={(e) => updateField("howWeMet", e.target.value)} />
        </div>

        <div>
          <label htmlFor="cf-notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="cf-notes" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[60px] resize-y" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{mode === "create" ? "Create" : "Save"}</Button>
        </div>
      </div>
    </Modal>
  );
}
