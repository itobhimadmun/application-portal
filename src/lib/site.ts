/**
 * Every piece of municipality branding is environment-driven so the same
 * codebase can be deployed for any local government without touching code.
 */
export const site = {
  nameNe: process.env.NEXT_PUBLIC_MUNICIPALITY_NAME_NE || "नमुना नगरपालिका",
  nameEn: process.env.NEXT_PUBLIC_MUNICIPALITY_NAME_EN || "Sample Municipality",
  addressNe: process.env.NEXT_PUBLIC_MUNICIPALITY_ADDRESS_NE || "नगर कार्यपालिकाको कार्यालय, नेपाल",
  addressEn: process.env.NEXT_PUBLIC_MUNICIPALITY_ADDRESS_EN || "Office of the Municipal Executive, Nepal",
  provinceNe: process.env.NEXT_PUBLIC_PROVINCE_NE || "",
  provinceEn: process.env.NEXT_PUBLIC_PROVINCE_EN || "",
  districtNe: process.env.NEXT_PUBLIC_DISTRICT_NE || "",
  districtEn: process.env.NEXT_PUBLIC_DISTRICT_EN || "",
  phone: process.env.NEXT_PUBLIC_MUNICIPALITY_PHONE || "+977-00-000000",
  email: process.env.NEXT_PUBLIC_MUNICIPALITY_EMAIL || "info@example.gov.np",
  website: process.env.NEXT_PUBLIC_MUNICIPALITY_WEBSITE || "",
  logo: process.env.NEXT_PUBLIC_MUNICIPALITY_LOGO || "/emblem.svg",
  portalNameNe: "निवेदन तथा फारम पोर्टल",
  portalNameEn: "Application & Form Portal",
} as const;
