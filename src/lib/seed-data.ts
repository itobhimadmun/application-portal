import { sql } from "./db";
import { buildSearchIndex } from "./translit";
import { slugify } from "./slug";

/**
 * The starter library: categories, sections, wards and eight realistic sample
 * applications. Shared by `npm run db:seed` and the one-time /api/setup
 * endpoint so both paths produce identical content.
 *
 * None of this text is displayed — an application page shows the form and
 * nothing else. It exists so that search has something to match on before any
 * real forms have been uploaded.
 */

type Seed = {
  title_ne: string; title_en: string;
  description_ne: string; description_en: string;
  /** Long-form context. Search-only, like everything else here. */
  about_ne: string; about_en: string;
  category: string; section: string;
  keywords_ne: string[]; keywords_en: string[]; aliases: string[];
};

export const CATEGORIES = [
  { slug: "sifaris", ne: "सिफारिस", en: "Recommendation", icon: "stamp" },
  { slug: "darta", ne: "दर्ता", en: "Registration", icon: "doc" },
  { slug: "rajaswa", ne: "राजस्व", en: "Revenue", icon: "cash" },
  { slug: "nirman", ne: "निर्माण", en: "Construction", icon: "tools" },
  { slug: "byabasaya", ne: "व्यवसाय", en: "Business", icon: "building" },
  { slug: "samajik-sewa", ne: "सामाजिक सेवा", en: "Social Services", icon: "heart" },
  { slug: "prasasan", ne: "प्रशासन", en: "Administration", icon: "grid" },
  { slug: "shiksha", ne: "शिक्षा", en: "Education", icon: "book" },
  { slug: "swasthya", ne: "स्वास्थ्य", en: "Health", icon: "heart" },
  { slug: "anya", ne: "अन्य", en: "Other", icon: "doc" },
];

export const SECTIONS = [
  { slug: "prasasan-shakha", ne: "प्रशासन शाखा", en: "Administration Section", dne: "सिफारिस, प्रमाणित तथा सामान्य प्रशासन", den: "Recommendations, certifications and general administration" },
  { slug: "rajaswa-shakha", ne: "राजस्व शाखा", en: "Revenue Section", dne: "कर, दस्तुर तथा व्यवसाय दर्ता", den: "Tax, fees and business registration" },
  { slug: "yojana-shakha", ne: "योजना तथा प्राविधिक शाखा", en: "Planning & Technical Section", dne: "नक्सा, निर्माण तथा पूर्वाधार", den: "Building permits, construction and infrastructure" },
  { slug: "panjikaran-shakha", ne: "पञ्जीकरण शाखा", en: "Vital Registration Section", dne: "जन्म, मृत्यु, विवाह, बसाइँसराइ दर्ता", den: "Birth, death, marriage and migration registration" },
  { slug: "samajik-bikas-shakha", ne: "सामाजिक विकास शाखा", en: "Social Development Section", dne: "सामाजिक सुरक्षा भत्ता तथा लक्षित वर्ग", den: "Social security allowance and targeted groups" },
  { slug: "shiksha-shakha", ne: "शिक्षा शाखा", en: "Education Section", dne: "विद्यालय तथा शैक्षिक सेवा", den: "Schools and education services" },
  { slug: "swasthya-shakha", ne: "स्वास्थ्य शाखा", en: "Health Section", dne: "स्वास्थ्य संस्था तथा सेवा", den: "Health institutions and services" },
  { slug: "suchana-prabidhi-shakha", ne: "सूचना प्रविधि शाखा", en: "Information Technology Section", dne: "वेबसाइट, प्रणाली तथा प्राविधिक सहयोग", den: "Website, systems and technical support" },
];

export const WARD_COUNT = Number(process.env.SEED_WARD_COUNT || 12);

export const SERVICES: Seed[] = [
  {
    title_ne: "नागरिकता सिफारिस",
    title_en: "Citizenship Recommendation",
    description_ne: "वंशज वा वैवाहिक अंगीकृत नागरिकता प्रमाणपत्र लिन जिल्ला प्रशासन कार्यालयमा पेश गर्नुपर्ने सिफारिस।",
    description_en: "Recommendation letter required by the District Administration Office to obtain a citizenship certificate.",
    about_ne: "१६ वर्ष पूरा भएका नेपाली नागरिकले नागरिकता प्रमाणपत्र लिन वडा कार्यालयबाट सिफारिस लिनुपर्छ। यसै सिफारिसका आधारमा जिल्ला प्रशासन कार्यालयले नागरिकता जारी गर्दछ।",
    about_en: "Nepali citizens who have completed 16 years of age need a ward recommendation before the District Administration Office issues a citizenship certificate.",
    category: "sifaris", section: "prasasan-shakha",
    keywords_ne: ["नागरिकता", "सिफारिस", "नागरिकता सिफारिस", "प्रमाणपत्र", "वंशज"],
    keywords_en: ["citizenship", "recommendation", "certificate", "nagarikta", "sifaris"],
    aliases: ["नागरिकताको सिफारिस", "citizenship sifaris", "nagarikta sifaris"],
  },
  {
    title_ne: "जन्म दर्ता",
    title_en: "Birth Registration",
    description_ne: "बच्चा जन्मेको ३५ दिनभित्र नि:शुल्क जन्म दर्ता गराउन दिइने निवेदन।",
    description_en: "Application to register a birth — free of charge when filed within 35 days.",
    about_ne: "व्यक्तिगत घटना दर्ता ऐन अनुसार जन्म भएको ३५ दिनभित्र स्थानीय पञ्जिकाधिकारी समक्ष जन्म दर्ता गराउनुपर्छ। ढिलो भएमा जरिवाना लाग्न सक्छ।",
    about_en: "Under the Vital Registration Act a birth must be registered with the local registrar within 35 days. Late registration may attract a fine.",
    category: "darta", section: "panjikaran-shakha",
    keywords_ne: ["जन्म", "जन्म दर्ता", "बच्चा", "व्यक्तिगत घटना", "पञ्जीकरण"],
    keywords_en: ["birth", "birth registration", "child", "vital registration", "janma darta"],
    aliases: ["जन्मदर्ता", "janma darta", "birth certificate"],
  },
  {
    title_ne: "बसोबास सिफारिस",
    title_en: "Residence Recommendation",
    description_ne: "नगरपालिका क्षेत्रभित्र बसोबास गरेको प्रमाणित गर्ने सिफारिस पत्र।",
    description_en: "A letter certifying that the applicant resides within the municipality.",
    about_ne: "बैंक खाता, विद्यालय भर्ना, राहदानी वा अन्य प्रयोजनका लागि बसोबास प्रमाणित गर्नुपर्दा यो सिफारिस लिइन्छ।",
    about_en: "Required when residence must be proven for a bank account, school admission, passport or similar purposes.",
    category: "sifaris", section: "prasasan-shakha",
    keywords_ne: ["बसोबास", "बसाई", "सिफारिस", "ठेगाना", "स्थायी बसोबास"],
    keywords_en: ["residence", "domicile", "address", "basobas", "sifaris", "residency"],
    aliases: ["बसोबास प्रमाणित", "basobas sifaris", "residence certificate"],
  },
  {
    title_ne: "घरबाटो सिफारिस",
    title_en: "House-Road (Access Road) Recommendation",
    description_ne: "घर वा जग्गासम्म पुग्ने बाटो रहेको प्रमाणित गर्ने सिफारिस।",
    description_en: "Recommendation certifying that a plot or house has road access.",
    about_ne: "बैंक धितो, जग्गा खरिद-बिक्री, घर नक्सा पास लगायतका काममा जग्गासम्म बाटो रहेको प्रमाणित गर्न यो सिफारिस आवश्यक पर्दछ।",
    about_en: "Needed for bank collateral, land transactions and building permits to certify that the plot is served by a road.",
    category: "sifaris", section: "yojana-shakha",
    keywords_ne: ["घरबाटो", "घर बाटो", "बाटो", "सिफारिस", "पहुँच मार्ग", "जग्गा"],
    keywords_en: ["house road", "access road", "road access", "gharbato", "ghar bato", "sifaris"],
    aliases: ["घरबाटो प्रमाणित", "gharbato sifaris", "बाटो सिफारिस", "road recommendation"],
  },
  {
    title_ne: "व्यवसाय दर्ता",
    title_en: "Business Registration",
    description_ne: "नगरपालिका क्षेत्रभित्र सञ्चालन हुने उद्योग/व्यवसाय दर्ता गर्ने निवेदन।",
    description_en: "Application to register a business operating inside the municipality.",
    about_ne: "नगरपालिका क्षेत्रभित्र व्यवसाय सञ्चालन गर्नुअघि राजस्व शाखामा दर्ता गराई व्यवसाय दर्ता प्रमाणपत्र लिनुपर्छ। प्रत्येक आर्थिक वर्ष नवीकरण गर्नुपर्दछ।",
    about_en: "Before operating a business in the municipality it must be registered with the Revenue Section. Registration is renewed each fiscal year.",
    category: "byabasaya", section: "rajaswa-shakha",
    keywords_ne: ["व्यवसाय", "व्यापार", "दर्ता", "पसल", "उद्योग", "फर्म"],
    keywords_en: ["business", "registration", "firm", "shop", "trade licence", "byabasaya darta"],
    aliases: ["व्यवसाय दर्ता प्रमाणपत्र", "business licence", "byapar darta"],
  },
  {
    title_ne: "चारकिल्ला प्रमाणित सिफारिस",
    title_en: "Four-Boundary (Charkilla) Certification",
    description_ne: "जग्गाको चारै तर्फको सिमाना प्रमाणित गर्ने सिफारिस।",
    description_en: "Recommendation certifying the four boundaries of a land parcel.",
    about_ne: "जग्गा खरिद-बिक्री, धितो वा नामसारीका लागि जग्गाको चारकिल्ला प्रमाणित गर्नुपर्दा वडा कार्यालयबाट यो सिफारिस लिइन्छ।",
    about_en: "Used for land transactions, mortgages and ownership transfers where the parcel boundaries must be certified.",
    category: "sifaris", section: "prasasan-shakha",
    keywords_ne: ["चारकिल्ला", "सिमाना", "जग्गा", "सिफारिस", "प्रमाणित"],
    keywords_en: ["charkilla", "four boundary", "land boundary", "sifaris", "certification"],
    aliases: ["चार किल्ला", "charkilla sifaris", "boundary certificate"],
  },
  {
    title_ne: "नाता प्रमाणित",
    title_en: "Relationship (Naata) Certification",
    description_ne: "दुई वा बढी व्यक्तिबीचको नाता सम्बन्ध प्रमाणित गर्ने सिफारिस।",
    description_en: "Certification of the family relationship between two or more people.",
    about_ne: "अंश, हकदावी, बैंक, बीमा, राहदानी वा वैदेशिक प्रयोजनका लागि नाता प्रमाणित गर्नुपर्दा यो सेवा प्रयोग हुन्छ।",
    about_en: "Used when a family relationship must be certified for inheritance, banking, insurance, passport or foreign purposes.",
    category: "sifaris", section: "prasasan-shakha",
    keywords_ne: ["नाता", "नाता प्रमाणित", "सम्बन्ध", "परिवार", "सिफारिस"],
    keywords_en: ["relationship", "naata", "family relation", "kinship", "certification"],
    aliases: ["नाता कायम", "naata pramanit", "relationship certificate"],
  },
  {
    title_ne: "घर नक्सा पास सम्बन्धी निवेदन",
    title_en: "Building Permit (House Map Approval)",
    description_ne: "नयाँ घर निर्माण वा थपघट गर्नुअघि नक्सा स्वीकृत गराउने निवेदन।",
    description_en: "Application to approve a building drawing before new construction or an extension.",
    about_ne: "भवन ऐन तथा नगरपालिकाको भवन निर्माण मापदण्ड अनुसार घर निर्माण गर्नुअघि नक्सा पास गराउनु अनिवार्य छ। स्वीकृतिपछि मात्र निर्माण सुरु गर्न पाइन्छ।",
    about_en: "Under the building code and municipal standards, a drawing must be approved before construction starts.",
    category: "nirman", section: "yojana-shakha",
    keywords_ne: ["घर नक्सा", "नक्सा पास", "घर बनाउने", "निर्माण", "भवन", "नक्सा"],
    keywords_en: ["building permit", "house map", "map approval", "construction", "naksa pass", "ghar banaune"],
    aliases: ["नक्शा पास", "naksa pass", "building approval", "घर बनाउन अनुमति"],
  },
];

/** Insert (or refresh) the whole sample library. Returns a one-line summary. */
export async function seedSampleLibrary(): Promise<string> {
  for (const [i, c] of CATEGORIES.entries()) {
    await sql`
      INSERT INTO categories (slug, name_ne, name_en, icon, sort_order)
      VALUES (${c.slug}, ${c.ne}, ${c.en}, ${c.icon}, ${i})
      ON CONFLICT (slug) DO UPDATE SET name_ne = EXCLUDED.name_ne, name_en = EXCLUDED.name_en`;
  }
  for (const [i, s] of SECTIONS.entries()) {
    await sql`
      INSERT INTO sections (slug, name_ne, name_en, description_ne, description_en, sort_order)
      VALUES (${s.slug}, ${s.ne}, ${s.en}, ${s.dne}, ${s.den}, ${i})
      ON CONFLICT (slug) DO UPDATE SET name_ne = EXCLUDED.name_ne, name_en = EXCLUDED.name_en`;
  }
  for (let n = 1; n <= WARD_COUNT; n++) {
    await sql`
      INSERT INTO wards (number, name_ne, name_en, office_ne, office_en)
      VALUES (${n}, ${`वडा नं. ${n}`}, ${`Ward No. ${n}`},
              ${`वडा नं. ${n} को कार्यालय`}, ${`Ward No. ${n} Office`})
      ON CONFLICT (number) DO NOTHING`;
  }

  for (const service of SERVICES) {
    const slug = slugify(service.title_en);
    const [category] = await sql<{ id: number }[]>`SELECT id FROM categories WHERE slug = ${service.category}`;
    const [section] = await sql<{ id: number }[]>`SELECT id FROM sections WHERE slug = ${service.section}`;

    const searchIndex = buildSearchIndex([
      service.title_ne, service.title_en, service.description_ne, service.description_en,
      service.about_ne, service.about_en,
      ...service.keywords_ne, ...service.keywords_en, ...service.aliases,
    ]);

    await sql`
      INSERT INTO applications (
        slug, title_ne, title_en, description_ne, description_en,
        category_id, section_id, all_wards,
        keywords_ne, keywords_en, aliases, search_index,
        status, is_sample, published_at
      ) VALUES (
        ${slug}, ${service.title_ne}, ${service.title_en}, ${service.description_ne},
        ${service.description_en}, ${category?.id ?? null}, ${section?.id ?? null}, TRUE,
        ${service.keywords_ne}, ${service.keywords_en}, ${service.aliases}, ${searchIndex},
        'published', TRUE, now()
      )
      ON CONFLICT (slug) DO UPDATE SET
        title_ne = EXCLUDED.title_ne, title_en = EXCLUDED.title_en,
        description_ne = EXCLUDED.description_ne, description_en = EXCLUDED.description_en,
        category_id = EXCLUDED.category_id, section_id = EXCLUDED.section_id,
        keywords_ne = EXCLUDED.keywords_ne, keywords_en = EXCLUDED.keywords_en,
        aliases = EXCLUDED.aliases, search_index = EXCLUDED.search_index,
        updated_at = now()`;
  }

  return `${SERVICES.length} services, ${CATEGORIES.length} categories, ${SECTIONS.length} sections, ${WARD_COUNT} wards`;
}
