/**
 * Shared types for CSV and Attio importers.
 */

export interface ImportContact {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  linkedin?: string;
  location?: string;
  tier?: string;
  tags?: string[];
  howWeMet?: string;
  notes?: string;
  sourceSystem: "csv" | "attio";
  sourceId?: string;
  sourcePayload?: string;
}

export interface ImportCompany {
  name: string;
  domain?: string;
  website?: string;
  linkedin?: string;
  industry?: string;
  description?: string;
  location?: string;
  tags?: string[];
  notes?: string;
  sourceSystem: "csv" | "attio";
  sourceId?: string;
  sourcePayload?: string;
}

export interface ImportResult {
  contactsCreated: number;
  contactsSkipped: number;
  companiesCreated: number;
  companiesSkipped: number;
  errors: string[];
}

/**
 * CSV header aliases — maps common CSV column names to Forge field names.
 */
export const HEADER_ALIASES: Record<string, string> = {
  // name
  full_name: "name",
  fullname: "name",
  "first name": "name",
  first_name: "name",
  contact_name: "name",
  contact: "name",
  // email
  email_address: "email",
  e_mail: "email",
  mail: "email",
  // phone
  phone_number: "phone",
  telephone: "phone",
  mobile: "phone",
  cell: "phone",
  // company
  company_name: "company",
  organization: "company",
  org: "company",
  employer: "company",
  // role
  title: "role",
  job_title: "role",
  position: "role",
  // linkedin
  linkedin_url: "linkedin",
  linkedin_profile: "linkedin",
  // location
  city: "location",
  address: "location",
  // tier
  priority: "tier",
  // notes
  note: "notes",
  comment: "notes",
  comments: "notes",
  // website (for companies)
  url: "website",
  web: "website",
  homepage: "website",
  // domain
  company_domain: "domain",
  // tags
  tag: "tags",
  labels: "tags",
  label: "tags",
  categories: "tags",
  category: "tags",
};

/**
 * Known Forge contact fields.
 */
export const CONTACT_FIELDS = new Set([
  "name",
  "email",
  "phone",
  "company",
  "role",
  "linkedin",
  "location",
  "tier",
  "tags",
  "notes",
  "howWeMet",
  "how_we_met",
  "website",
  "domain",
]);
