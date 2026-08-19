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

export type ApplicationFile = {
  id: number; application_id: number; position: number;
  label_ne: string; label_en: string; kind: FileKind; is_editable: boolean;
  storage: "db" | "blob"; url: string | null; blob_pathname: string | null;
  mime: string; size: number; original_name: string; created_at: string;
  /** A .docx carrying {{placeholders}} that citizens can fill online. */
  is_template: boolean;
  template_fields: TemplateField[];
  /** Cached print-shaped HTML of the document, built when the file is saved. */
  preview_html: string;
  preview_page: DocxPageBox | null;
};

/** Page box in points, so the preview can be drawn at the document's real size. */
export type DocxPageBox = {
  width: number; height: number;
  marginTop: number; marginRight: number; marginBottom: number; marginLeft: number;
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
  updated_at: string;
  category_slug: string | null; category_name_ne: string | null; category_name_en: string | null;
  section_slug: string | null; section_name_ne: string | null; section_name_en: string | null;
  file_kinds: FileKind[];
  ward_numbers: number[];
  /* The four actions a listing row needs, resolved in the same query. */
  word_file_id: number | null;
  pdf_file_id: number | null;
  fillable: boolean;
  viewable: boolean;
  score?: number;
};

export type ApplicationDetail = ApplicationSummary & {
  /** Never displayed — these exist to make the form findable. */
  keywords_ne: string[]; keywords_en: string[]; aliases: string[];
  view_count: number;
  created_at: string;
  published_at: string | null;
  files: ApplicationFile[];
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
