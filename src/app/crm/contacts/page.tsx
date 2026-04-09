"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import ContactList, { type ContactListItem } from "@/components/crm/contacts/ContactList";
import ContactDetail, { type ContactFullData, type MeetingNoteData } from "@/components/crm/contacts/ContactDetail";
import ContactForm, { type ContactFormData } from "@/components/crm/contacts/ContactForm";
import type { ActivityData } from "@/components/crm/ActivityTimeline";
import ImportModal from "@/components/crm/import/ImportModal";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function ContactsPage() {
  return (
    <Suspense>
      <ContactsPageInner />
    </Suspense>
  );
}

function ContactsPageInner() {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(
    () => searchParams.get("id")
  );
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Queries
  const contactsRaw = useQuery(api.contacts.list, {
    search: search || undefined,
    tier: tierFilter || undefined,
    status: statusFilter || undefined,
    tag: tagFilter || undefined,
  });
  const selectedContactRaw = useQuery(
    api.contacts.get,
    selectedId ? { id: selectedId as never } : "skip"
  );
  const activitiesRaw = useQuery(
    api.contactActivities.listByContact,
    selectedId ? { contactId: selectedId as never } : "skip"
  );
  const meetingNotesRaw = useQuery(
    api.meetingNotes.listByContact,
    selectedId ? { contactId: selectedId as never } : "skip"
  );

  const { showToast } = useToast();

  // Mutations
  const createContact = useMutation(api.contacts.create);
  const updateContact = useMutation(api.contacts.update);
  const deleteContact = useMutation(api.contacts.remove);

  const contacts = contactsRaw as ContactListItem[] | undefined;
  const selectedContact = selectedContactRaw as ContactFullData | null | undefined;
  const activities = activitiesRaw as ActivityData[] | undefined;
  const meetingNotes = meetingNotesRaw as MeetingNoteData[] | undefined;

  // Compute unique tags for filter dropdown
  const allTags = Array.from(
    new Set((contacts ?? []).flatMap((c) => c.tags))
  ).sort();

  const handleCreate = async (data: ContactFormData) => {
    try {
      const id = await createContact({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        company: data.company || undefined,
        role: data.role || undefined,
        linkedin: data.linkedin || undefined,
        location: data.location || undefined,
        tier: data.tier || "C",
        status: (data.status as never) || undefined,
        howWeMet: data.howWeMet || undefined,
        notes: data.notes || undefined,
      });
      setSelectedId(id as unknown as string);
    } catch {
      showToast("Failed to create contact. Please try again.");
    }
  };

  const handleUpdate = async (data: ContactFormData) => {
    if (!selectedId) return;
    try {
      await updateContact({
        id: selectedId as never,
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        company: data.company || undefined,
        role: data.role || undefined,
        linkedin: data.linkedin || undefined,
        location: data.location || undefined,
        tier: data.tier || undefined,
        status: (data.status as never) || undefined,
        howWeMet: data.howWeMet || undefined,
        notes: data.notes || undefined,
      });
      setEditMode(false);
    } catch {
      showToast("Failed to update contact. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteContact({ id: selectedId as never });
      setSelectedId(null);
    } catch {
      showToast("Failed to delete contact. Please try again.");
    }
  };

  const handleUpdateTags = async (tags: string[]) => {
    if (!selectedId) return;
    try {
      await updateContact({ id: selectedId as never, tags });
    } catch {
      showToast("Failed to update tags. Please try again.");
    }
  };

  return (
    <div className="flex h-full">
      {/* Left: Contact List */}
      <div className="w-80 flex-shrink-0">
        <ContactList
          contacts={contacts}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={() => {
            setEditMode(false);
            setFormOpen(true);
          }}
          search={search}
          onSearchChange={setSearch}
          tierFilter={tierFilter}
          onTierFilterChange={setTierFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          allTags={allTags}
        />
      </div>

      {/* Right: Detail or Empty State */}
      <div className="flex-1 min-w-0">
        {selectedContact ? (
          <ContactDetail
            contact={selectedContact}
            activities={activities}
            meetingNotes={meetingNotes}
            onEdit={() => {
              setEditMode(true);
              setFormOpen(true);
            }}
            onDelete={handleDelete}
            onUpdateTags={handleUpdateTags}
          />
        ) : (
          <EmptyState
            title="Select a contact"
            description="Choose a contact from the list, add a new one, or import from CSV/Attio."
            action={
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEditMode(false);
                    setFormOpen(true);
                  }}
                >
                  + Add Contact
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setImportOpen(true)}
                >
                  Import
                </Button>
              </div>
            }
            className="h-full"
          />
        )}
      </div>

      {/* Create / Edit form */}
      <ContactForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditMode(false);
        }}
        onSubmit={editMode ? handleUpdate : handleCreate}
        mode={editMode ? "edit" : "create"}
        initial={
          editMode && selectedContact
            ? {
                name: selectedContact.name,
                email: selectedContact.email ?? "",
                phone: selectedContact.phone ?? "",
                company: selectedContact.companyNameCached ?? selectedContact.company ?? "",
                role: selectedContact.role ?? "",
                linkedin: selectedContact.linkedin ?? "",
                location: selectedContact.location ?? "",
                tier: selectedContact.tier,
                status: selectedContact.status ?? "lead",
                howWeMet: selectedContact.howWeMet ?? "",
                notes: selectedContact.notes ?? "",
              }
            : undefined
        }
      />

      {/* Import modal */}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
