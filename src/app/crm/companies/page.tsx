"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import CompanyList, { type CompanyListItem } from "@/components/crm/companies/CompanyList";
import CompanyDetail, { type CompanyFullData, type LinkedContact } from "@/components/crm/companies/CompanyDetail";
import CompanyForm, { type CompanyFormData } from "@/components/crm/companies/CompanyForm";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function CompaniesPage() {
  return (
    <Suspense>
      <CompaniesPageInner />
    </Suspense>
  );
}

function CompaniesPageInner() {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(
    () => searchParams.get("id")
  );
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const companiesRaw = useQuery(api.companies.list, {
    search: search || undefined,
    industry: industryFilter || undefined,
    tag: tagFilter || undefined,
  });
  const selectedCompanyRaw = useQuery(
    api.companies.get,
    selectedId ? { id: selectedId as never } : "skip"
  );
  const linkedContactsRaw = useQuery(
    api.companies.linkedContacts,
    selectedId ? { companyId: selectedId as never } : "skip"
  );

  const createCompany = useMutation(api.companies.create);
  const updateCompany = useMutation(api.companies.update);
  const deleteCompany = useMutation(api.companies.remove);
  const { showToast } = useToast();

  const companies = companiesRaw as CompanyListItem[] | undefined;
  const selectedCompany = selectedCompanyRaw as CompanyFullData | null | undefined;
  const linkedContacts = linkedContactsRaw as LinkedContact[] | undefined;

  // Compute unique industries and tags for filter dropdowns
  const allIndustries = Array.from(
    new Set((companies ?? []).map((c) => c.industry).filter((i): i is string => Boolean(i)))
  ).sort();
  const allTags = Array.from(
    new Set((companies ?? []).flatMap((c) => c.tags))
  ).sort();

  // Enrich companies with linked contact count
  const enrichedCompanies = companies?.map((c) => ({
    ...c,
    linkedContactCount: c._id === selectedId ? (linkedContacts?.length ?? 0) : undefined,
  }));

  const handleCreate = async (data: CompanyFormData) => {
    try {
      const id = await createCompany({
        name: data.name,
        domain: data.domain || undefined,
        website: data.website || undefined,
        linkedin: data.linkedin || undefined,
        industry: data.industry || undefined,
        description: data.description || undefined,
        location: data.location || undefined,
        notes: data.notes || undefined,
      });
      setSelectedId(id as unknown as string);
    } catch {
      showToast("Failed to create company. Please try again.");
    }
  };

  const handleUpdate = async (data: CompanyFormData) => {
    if (!selectedId) return;
    try {
      await updateCompany({
        id: selectedId as never,
        name: data.name,
        domain: data.domain || undefined,
        website: data.website || undefined,
        linkedin: data.linkedin || undefined,
        industry: data.industry || undefined,
        description: data.description || undefined,
        location: data.location || undefined,
        notes: data.notes || undefined,
      });
      setEditMode(false);
    } catch {
      showToast("Failed to update company. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteCompany({ id: selectedId as never });
      setSelectedId(null);
    } catch {
      showToast("Failed to delete company. Please try again.");
    }
  };

  const handleUpdateTags = async (tags: string[]) => {
    if (!selectedId) return;
    try {
      await updateCompany({ id: selectedId as never, tags });
    } catch {
      showToast("Failed to update tags. Please try again.");
    }
  };

  const handleContactClick = (contactId: string) => {
    // Navigate to CRM contacts page with this contact selected
    window.location.href = `/crm/contacts?id=${contactId}`;
  };

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0">
        <CompanyList
          companies={enrichedCompanies}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={() => { setEditMode(false); setFormOpen(true); }}
          search={search}
          onSearchChange={setSearch}
          industryFilter={industryFilter}
          onIndustryFilterChange={setIndustryFilter}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          allIndustries={allIndustries}
          allTags={allTags}
        />
      </div>

      <div className="flex-1 min-w-0">
        {selectedCompany ? (
          <CompanyDetail
            company={selectedCompany}
            linkedContacts={linkedContacts}
            activities={undefined}
            onEdit={() => { setEditMode(true); setFormOpen(true); }}
            onDelete={handleDelete}
            onUpdateTags={handleUpdateTags}
            onContactClick={handleContactClick}
          />
        ) : (
          <EmptyState
            title="Select a company"
            description="Choose a company from the list or add a new one."
            action={
              <Button onClick={() => { setEditMode(false); setFormOpen(true); }}>
                + Add Company
              </Button>
            }
            className="h-full"
          />
        )}
      </div>

      <CompanyForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditMode(false); }}
        onSubmit={editMode ? handleUpdate : handleCreate}
        mode={editMode ? "edit" : "create"}
        initial={
          editMode && selectedCompany
            ? {
                name: selectedCompany.name,
                domain: selectedCompany.domain ?? "",
                website: selectedCompany.website ?? "",
                linkedin: selectedCompany.linkedin ?? "",
                industry: selectedCompany.industry ?? "",
                description: selectedCompany.description ?? "",
                location: selectedCompany.location ?? "",
                notes: selectedCompany.notes ?? "",
              }
            : undefined
        }
      />
    </div>
  );
}
