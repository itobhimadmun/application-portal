export type Status = "draft" | "published" | "archived";
export type FileKind = "pdf" | "word" | "excel" | "other";

export type Category = {
  id: number; slug: string; name_ne: string; name_en: string;
  icon: string; sort_order: number; is_active: boolean;
};

export type Section = {
  id: number; slug: string; name_ne: string; name_en: string;
  description_ne: string; description_en: string; contact: string;
  sort_order: number; is_active: boolean;
};

export type Ward = {
  id: number; number: number; name_ne: string; name_en: string;
  office_ne: string; office_en: string; contact: string; is_active: boolean;
};

export type ApplicationStep = {
  id: number; application_id: number; position: number;
  title_ne: string; title_en: string; description_ne: string; description_en: string;
};

export type RequiredDocument = {
  id: number; application_id: number; position: number;
  label_ne: string; label_en: string; note_ne: string; note_en: string; is_required: boolean;
};

export type ApplicationFile = {
  id: number; application_id: number; position: number;
  label_ne: string; label_en: string; kind: FileKind; is_editable: boolean;
  storage: "db" | "blob"; url: string | null; blob_pathname: string | null;
  mime: string; size: number; original_name: string; created_at: string;
  /** A .docx carrying {{placeholders}} that citizens can fill online. */
  is_template: boolean;
  template_fields: TemplateField[];
};

export type TemplateField = {
  key: string;
  label_ne: string;
  label_en: string;
  type: "text" | "textarea" | "number" | "date";
};

export type ApplicationSummary = {
  id: number; slug: string;
  title_ne: string; title_en: string;
  description_ne: string; description_en: string;
  status: Status; is_sample: boolean;
  all_wards: boolean;
  office_ne: string; office_en: string;
  online_form_enabled: boolean;
  updated_at: string;
  category_slug: string | null; category_name_ne: string | null; category_name_en: string | null;
  section_slug: string | null; section_name_ne: string | null; section_name_en: string | null;
  document_count: number;
  step_count: number;
  file_kinds: FileKind[];
  ward_numbers: number[];
  score?: number;
};

export type ApplicationDetail = ApplicationSummary & {
  about_ne: string; about_en: string;
  fee_ne: string; fee_en: string;
  duration_ne: string; duration_en: string;
  keywords_ne: string[]; keywords_en: string[]; aliases: string[];
  online_form_schema: FormField[];
  view_count: number;
  created_at: string;
  published_at: string | null;
  steps: ApplicationStep[];
  requirements: RequiredDocument[];
  files: ApplicationFile[];
};

export type FormField = {
  key: string;
  label_ne: string;
  label_en: string;
  type: "text" | "textarea" | "number" | "date";
  required?: boolean;
};

export type SearchParamsShape = {
  q?: string;
  category?: string;
  section?: string;
  ward?: string;
  doc?: string;
  page?: number;
  perPage?: number;
};
