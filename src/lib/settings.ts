import { sql } from "./db";

/**
 * Portal identity. Values live in the `settings` table so an administrator can
 * rebrand the whole portal from Admin → Settings with no redeploy. Environment
 * variables are only the fallback for a fresh install.
 */
export type SiteSettings = {
  nameNe: string; nameEn: string;
  addressNe: string; addressEn: string;
  provinceNe: string; provinceEn: string;
  districtNe: string; districtEn: string;
  phone: string; email: string; website: string; logo: string;
  portalNameNe: string; portalNameEn: string;
};

export const SETTING_KEYS: (keyof SiteSettings)[] = [
  "nameNe", "nameEn", "addressNe", "addressEn", "provinceNe", "provinceEn",
  "districtNe", "districtEn", "phone", "email", "website", "logo",
  "portalNameNe", "portalNameEn",
];

function fromEnv(): SiteSettings {
  return {
    nameNe: process.env.NEXT_PUBLIC_MUNICIPALITY_NAME_NE || "नमुना नगरपालिका",
    nameEn: process.env.NEXT_PUBLIC_MUNICIPALITY_NAME_EN || "Sample Municipality",
    addressNe: process.env.NEXT_PUBLIC_MUNICIPALITY_ADDRESS_NE || "नगर कार्यपालिकाको कार्यालय",
    addressEn: process.env.NEXT_PUBLIC_MUNICIPALITY_ADDRESS_EN || "Office of the Municipal Executive",
    provinceNe: process.env.NEXT_PUBLIC_PROVINCE_NE || "",
    provinceEn: process.env.NEXT_PUBLIC_PROVINCE_EN || "",
    districtNe: process.env.NEXT_PUBLIC_DISTRICT_NE || "",
    districtEn: process.env.NEXT_PUBLIC_DISTRICT_EN || "",
    phone: process.env.NEXT_PUBLIC_MUNICIPALITY_PHONE || "",
    email: process.env.NEXT_PUBLIC_MUNICIPALITY_EMAIL || "",
    website: process.env.NEXT_PUBLIC_MUNICIPALITY_WEBSITE || "",
    logo: process.env.NEXT_PUBLIC_MUNICIPALITY_LOGO || "/emblem.svg",
    portalNameNe: "निवेदन तथा फारम पोर्टल",
    portalNameEn: "Application & Form Portal",
  };
}

/** Read the live settings, falling back to environment defaults per field. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const defaults = fromEnv();
  try {
    const rows = await sql<{ key: string; value: string }[]>`
      SELECT key, value FROM settings WHERE key LIKE 'site.%'`;
    const stored = Object.fromEntries(rows.map((r) => [r.key.replace(/^site\./, ""), r.value]));
    const merged = { ...defaults };
    for (const key of SETTING_KEYS) {
      const value = stored[key];
      if (typeof value === "string" && value.trim()) merged[key] = value;
    }
    return merged;
  } catch {
    return defaults;
  }
}

export async function saveSiteSettings(values: Partial<SiteSettings>): Promise<void> {
  for (const key of SETTING_KEYS) {
    const value = values[key];
    if (value === undefined) continue;
    await sql`
      INSERT INTO settings (key, value, updated_at)
      VALUES (${`site.${key}`}, ${value}, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
  }
}
