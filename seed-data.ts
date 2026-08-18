import { sql } from "./db";
import { buildSearchIndex } from "./translit";
import { slugify } from "./slug";

/**
 * The starter library: categories, sections, wards and eight realistic sample
 * services. Shared by `npm run db:seed` and the one-time /api/setup endpoint so
 * both paths produce byte-identical content.
 */

type Step = { ne: string; en: string; dne?: string; den?: string };
type Doc = { ne: string; en: string; optional?: boolean };

type Seed = {
  title_ne: string; title_en: string;
  description_ne: string; description_en: string;
  about_ne: string; about_en: string;
  category: string; section: string;
  office_ne: string; office_en: string;
  fee_ne: string; fee_en: string;
  duration_ne: string; duration_en: string;
  keywords_ne: string[]; keywords_en: string[]; aliases: string[];
  steps: Step[]; docs: Doc[];
  online?: boolean;
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
    office_ne: "सम्बन्धित वडा कार्यालय", office_en: "Relevant Ward Office",
    fee_ne: "रू. १००", fee_en: "NPR 100",
    duration_ne: "सोही दिन", duration_en: "Same day",
    keywords_ne: ["नागरिकता", "सिफारिस", "नागरिकता सिफारिस", "प्रमाणपत्र", "वंशज"],
    keywords_en: ["citizenship", "recommendation", "certificate", "nagarikta", "sifaris"],
    aliases: ["नागरिकताको सिफारिस", "citizenship sifaris", "nagarikta sifaris"],
    steps: [
      { ne: "आवश्यक कागजात तयार गर्नुहोस्", en: "Prepare the required documents", dne: "जन्मदर्ता, बाबु/आमाको नागरिकता र सक्कल प्रति साथै राख्नुहोस्।", den: "Bring the birth certificate, parents' citizenship and the originals." },
      { ne: "निवेदन फारम भर्नुहोस्", en: "Fill in the application form", dne: "यसै पृष्ठबाट फारम डाउनलोड गरी वा अनलाइन भरी प्रिन्ट गर्नुहोस्।", den: "Download the form from this page or fill it online and print it." },
      { ne: "वडा कार्यालयमा पेश गर्नुहोस्", en: "Submit at the ward office", dne: "निवेदकसहित सक्कल कागजात लिई उपस्थित हुनुपर्छ।", den: "The applicant must attend in person with the original documents." },
      { ne: "वडा सचिवबाट जाँच तथा सिफारिस", en: "Verification and recommendation by the ward secretary" },
      { ne: "सिफारिस पत्र प्राप्त गर्नुहोस्", en: "Collect the recommendation letter", dne: "जिल्ला प्रशासन कार्यालयमा बुझाउनुहोस्।", den: "Submit it to the District Administration Office." },
    ],
    docs: [
      { ne: "जन्म दर्ता प्रमाणपत्रको प्रतिलिपि", en: "Copy of the birth registration certificate" },
      { ne: "बाबु र आमाको नागरिकता प्रमाणपत्रको प्रतिलिपि", en: "Copy of both parents' citizenship certificates" },
      { ne: "विवाह दर्ता प्रमाणपत्र (विवाहित महिलाका हकमा)", en: "Marriage registration certificate (for married women)", optional: true },
      { ne: "चालु आर्थिक वर्षको सम्पत्ति कर तिरेको रसिद", en: "Property tax receipt for the current fiscal year" },
      { ne: "पासपोर्ट साइजको फोटो २ प्रति", en: "Two passport-size photographs" },
    ],
    online: true,
  },
  {
    title_ne: "जन्म दर्ता",
    title_en: "Birth Registration",
    description_ne: "बच्चा जन्मेको ३५ दिनभित्र नि:शुल्क जन्म दर्ता गराउन दिइने निवेदन।",
    description_en: "Application to register a birth — free of charge when filed within 35 days.",
    about_ne: "व्यक्तिगत घटना दर्ता ऐन अनुसार जन्म भएको ३५ दिनभित्र स्थानीय पञ्जिकाधिकारी समक्ष जन्म दर्ता गराउनुपर्छ। ढिलो भएमा जरिवाना लाग्न सक्छ।",
    about_en: "Under the Vital Registration Act a birth must be registered with the local registrar within 35 days. Late registration may attract a fine.",
    category: "darta", section: "panjikaran-shakha",
    office_ne: "सम्बन्धित वडा कार्यालय (पञ्जिकाधिकारी)", office_en: "Ward Office (Local Registrar)",
    fee_ne: "३५ दिनभित्र नि:शुल्क", fee_en: "Free within 35 days",
    duration_ne: "सोही दिन", duration_en: "Same day",
    keywords_ne: ["जन्म", "जन्म दर्ता", "बच्चा", "व्यक्तिगत घटना", "पञ्जीकरण"],
    keywords_en: ["birth", "birth registration", "child", "vital registration", "janma darta"],
    aliases: ["जन्मदर्ता", "janma darta", "birth certificate"],
    steps: [
      { ne: "सूचक व्यक्ति निर्धारण गर्नुहोस्", en: "Identify the informant", dne: "सामान्यतया बाबु, आमा वा परिवारको मुख्य व्यक्ति सूचक हुन्छन्।", den: "Usually the father, mother or head of the household." },
      { ne: "निवेदन फारम भर्नुहोस्", en: "Complete the registration form" },
      { ne: "वडा कार्यालयमा पेश गर्नुहोस्", en: "Submit it at the ward office" },
      { ne: "पञ्जिकाधिकारीबाट दर्ता", en: "Registration by the local registrar" },
      { ne: "जन्म दर्ता प्रमाणपत्र प्राप्त गर्नुहोस्", en: "Collect the birth registration certificate" },
    ],
    docs: [
      { ne: "अस्पतालको जन्म सम्बन्धी कागजात वा जन्म भएको प्रमाण", en: "Hospital birth record or other proof of birth" },
      { ne: "बाबु र आमाको नागरिकता प्रमाणपत्रको प्रतिलिपि", en: "Copy of both parents' citizenship certificates" },
      { ne: "विवाह दर्ता प्रमाणपत्रको प्रतिलिपि", en: "Copy of the marriage registration certificate", optional: true },
      { ne: "सूचक व्यक्तिको नागरिकता प्रमाणपत्र", en: "Citizenship certificate of the informant" },
    ],
    online: true,
  },
  {
    title_ne: "बसोबास सिफारिस",
    title_en: "Residence Recommendation",
    description_ne: "नगरपालिका क्षेत्रभित्र बसोबास गरेको प्रमाणित गर्ने सिफारिस पत्र।",
    description_en: "A letter certifying that the applicant resides within the municipality.",
    about_ne: "बैंक खाता, विद्यालय भर्ना, राहदानी वा अन्य प्रयोजनका लागि बसोबास प्रमाणित गर्नुपर्दा यो सिफारिस लिइन्छ।",
    about_en: "Required when residence must be proven for a bank account, school admission, passport or similar purposes.",
    category: "sifaris", section: "prasasan-shakha",
    office_ne: "सम्बन्धित वडा कार्यालय", office_en: "Relevant Ward Office",
    fee_ne: "रू. १००", fee_en: "NPR 100",
    duration_ne: "सोही दिन", duration_en: "Same day",
    keywords_ne: ["बसोबास", "बसाई", "सिफारिस", "ठेगाना", "स्थायी बसोबास"],
    keywords_en: ["residence", "domicile", "address", "basobas", "sifaris", "residency"],
    aliases: ["बसोबास प्रमाणित", "basobas sifaris", "residence certificate"],
    steps: [
      { ne: "आवश्यक कागजात तयार गर्नुहोस्", en: "Prepare the required documents" },
      { ne: "निवेदन फारम भर्नुहोस्", en: "Fill in the application form" },
      { ne: "वडा कार्यालयमा पेश गर्नुहोस्", en: "Submit it at the ward office" },
      { ne: "स्थलगत/अभिलेख जाँच", en: "Record or field verification" },
      { ne: "सिफारिस पत्र प्राप्त गर्नुहोस्", en: "Collect the recommendation letter" },
    ],
    docs: [
      { ne: "निवेदकको नागरिकता प्रमाणपत्रको प्रतिलिपि", en: "Copy of the applicant's citizenship certificate" },
      { ne: "जग्गा धनी प्रमाण पुर्जा वा घरबहाल सम्झौता", en: "Land ownership certificate or rental agreement" },
      { ne: "चालु आर्थिक वर्षको मालपोत/सम्पत्ति कर रसिद", en: "Current fiscal year land or property tax receipt" },
    ],
  },
  {
    title_ne: "घरबाटो सिफारिस",
    title_en: "House-Road (Access Road) Recommendation",
    description_ne: "घर वा जग्गासम्म पुग्ने बाटो रहेको प्रमाणित गर्ने सिफारिस।",
    description_en: "Recommendation certifying that a plot or house has road access.",
    about_ne: "बैंक धितो, जग्गा खरिद-बिक्री, घर नक्सा पास लगायतका काममा जग्गासम्म बाटो रहेको प्रमाणित गर्न यो सिफारिस आवश्यक पर्दछ।",
    about_en: "Needed for bank collateral, land transactions and building permits to certify that the plot is served by a road.",
    category: "sifaris", section: "yojana-shakha",
    office_ne: "सम्बन्धित वडा कार्यालय", office_en: "Relevant Ward Office",
    fee_ne: "रू. ५०० सम्म (क्षेत्र अनुसार)", fee_en: "Up to NPR 500 depending on the area",
    duration_ne: "१–३ कार्य दिन", duration_en: "1–3 working days",
    keywords_ne: ["घरबाटो", "घर बाटो", "बाटो", "सिफारिस", "पहुँच मार्ग", "जग्गा"],
    keywords_en: ["house road", "access road", "road access", "gharbato", "ghar bato", "sifaris"],
    aliases: ["घरबाटो प्रमाणित", "gharbato sifaris", "बाटो सिफारिस", "road recommendation"],
    steps: [
      { ne: "आवश्यक कागजात तयार गर्नुहोस्", en: "Prepare the required documents" },
      { ne: "निवेदन फारम भरी पेश गर्नुहोस्", en: "Fill in and submit the application" },
      { ne: "प्राविधिकबाट स्थलगत निरीक्षण", en: "Site inspection by a technician" },
      { ne: "नापी/प्राविधिक प्रतिवेदन तयारी", en: "Technical report prepared" },
      { ne: "सिफारिस पत्र प्राप्त गर्नुहोस्", en: "Collect the recommendation letter" },
    ],
    docs: [
      { ne: "जग्गा धनी प्रमाण पुर्जाको प्रतिलिपि", en: "Copy of the land ownership certificate" },
      { ne: "नापी नक्सा (ट्रेस नक्सा)", en: "Survey (trace) map" },
      { ne: "चालु आर्थिक वर्षको मालपोत तिरेको रसिद", en: "Current fiscal year land revenue receipt" },
      { ne: "निवेदकको नागरिकता प्रमाणपत्रको प्रतिलिपि", en: "Copy of the applicant's citizenship certificate" },
    ],
  },
  {
    title_ne: "व्यवसाय दर्ता",
    title_en: "Business Registration",
    description_ne: "नगरपालिका क्षेत्रभित्र सञ्चालन हुने उद्योग/व्यवसाय दर्ता गर्ने निवेदन।",
    description_en: "Application to register a business operating inside the municipality.",
    about_ne: "नगरपालिका क्षेत्रभित्र व्यवसाय सञ्चालन गर्नुअघि राजस्व शाखामा दर्ता गराई व्यवसाय दर्ता प्रमाणपत्र लिनुपर्छ। प्रत्येक आर्थिक वर्ष नवीकरण गर्नुपर्दछ।",
    about_en: "Before operating a business in the municipality it must be registered with the Revenue Section. Registration is renewed each fiscal year.",
    category: "byabasaya", section: "rajaswa-shakha",
    office_ne: "राजस्व शाखा, नगर कार्यपालिकाको कार्यालय", office_en: "Revenue Section, Municipal Executive Office",
    fee_ne: "व्यवसायको प्रकृति अनुसार", fee_en: "Depends on the type of business",
    duration_ne: "१–२ कार्य दिन", duration_en: "1–2 working days",
    keywords_ne: ["व्यवसाय", "व्यापार", "दर्ता", "पसल", "उद्योग", "फर्म"],
    keywords_en: ["business", "registration", "firm", "shop", "trade licence", "byabasaya darta"],
    aliases: ["व्यवसाय दर्ता प्रमाणपत्र", "business licence", "byapar darta"],
    steps: [
      { ne: "व्यवसायको प्रकृति र स्थान निर्धारण गर्नुहोस्", en: "Decide the nature and location of the business" },
      { ne: "निवेदन फारम भर्नुहोस्", en: "Fill in the registration form" },
      { ne: "राजस्व शाखामा पेश गर्नुहोस्", en: "Submit it to the Revenue Section" },
      { ne: "दस्तुर बुझाउनुहोस्", en: "Pay the applicable fee" },
      { ne: "व्यवसाय दर्ता प्रमाणपत्र प्राप्त गर्नुहोस्", en: "Collect the business registration certificate" },
    ],
    docs: [
      { ne: "निवेदकको नागरिकता प्रमाणपत्रको प्रतिलिपि", en: "Copy of the applicant's citizenship certificate" },
      { ne: "घरबहाल सम्झौता वा जग्गा धनी प्रमाण पुर्जा", en: "Rental agreement or land ownership certificate" },
      { ne: "घरबहाल कर तिरेको प्रमाण", en: "Proof of house-rent tax payment", optional: true },
      { ne: "पासपोर्ट साइजको फोटो २ प्रति", en: "Two passport-size photographs" },
      { ne: "स्थायी लेखा नम्बर (PAN) प्रमाणपत्र", en: "Permanent Account Number (PAN) certificate", optional: true },
    ],
  },
  {
    title_ne: "चारकिल्ला प्रमाणित सिफारिस",
    title_en: "Four-Boundary (Charkilla) Certification",
    description_ne: "जग्गाको चारै तर्फको सिमाना प्रमाणित गर्ने सिफारिस।",
    description_en: "Recommendation certifying the four boundaries of a land parcel.",
    about_ne: "जग्गा खरिद-बिक्री, धितो वा नामसारीका लागि जग्गाको चारकिल्ला प्रमाणित गर्नुपर्दा वडा कार्यालयबाट यो सिफारिस लिइन्छ।",
    about_en: "Used for land transactions, mortgages and ownership transfers where the parcel boundaries must be certified.",
    category: "sifaris", section: "prasasan-shakha",
    office_ne: "सम्बन्धित वडा कार्यालय", office_en: "Relevant Ward Office",
    fee_ne: "रू. ३००", fee_en: "NPR 300",
    duration_ne: "१–२ कार्य दिन", duration_en: "1–2 working days",
    keywords_ne: ["चारकिल्ला", "सिमाना", "जग्गा", "सिफारिस", "प्रमाणित"],
    keywords_en: ["charkilla", "four boundary", "land boundary", "sifaris", "certification"],
    aliases: ["चार किल्ला", "charkilla sifaris", "boundary certificate"],
    steps: [
      { ne: "आवश्यक कागजात तयार गर्नुहोस्", en: "Prepare the required documents" },
      { ne: "निवेदन पेश गर्नुहोस्", en: "Submit the application" },
      { ne: "छिमेकी जग्गाधनीको रोहबरमा स्थलगत जाँच", en: "Field verification in the presence of neighbouring landowners" },
      { ne: "वडा कार्यालयबाट प्रमाणित", en: "Certification by the ward office" },
      { ne: "सिफारिस पत्र प्राप्त गर्नुहोस्", en: "Collect the certificate" },
    ],
    docs: [
      { ne: "जग्गा धनी प्रमाण पुर्जाको प्रतिलिपि", en: "Copy of the land ownership certificate" },
      { ne: "नापी नक्सा", en: "Survey map" },
      { ne: "मालपोत तिरेको रसिद", en: "Land revenue receipt" },
      { ne: "छिमेकी जग्गाधनीको नागरिकताको प्रतिलिपि", en: "Copies of neighbouring landowners' citizenship certificates", optional: true },
    ],
  },
  {
    title_ne: "नाता प्रमाणित",
    title_en: "Relationship (Naata) Certification",
    description_ne: "दुई वा बढी व्यक्तिबीचको नाता सम्बन्ध प्रमाणित गर्ने सिफारिस।",
    description_en: "Certification of the family relationship between two or more people.",
    about_ne: "अंश, हकदावी, बैंक, बीमा, राहदानी वा वैदेशिक प्रयोजनका लागि नाता प्रमाणित गर्नुपर्दा यो सेवा प्रयोग हुन्छ।",
    about_en: "Used when a family relationship must be certified for inheritance, banking, insurance, passport or foreign purposes.",
    category: "sifaris", section: "prasasan-shakha",
    office_ne: "सम्बन्धित वडा कार्यालय", office_en: "Relevant Ward Office",
    fee_ne: "रू. २००", fee_en: "NPR 200",
    duration_ne: "सोही दिन", duration_en: "Same day",
    keywords_ne: ["नाता", "नाता प्रमाणित", "सम्बन्ध", "परिवार", "सिफारिस"],
    keywords_en: ["relationship", "naata", "family relation", "kinship", "certification"],
    aliases: ["नाता कायम", "naata pramanit", "relationship certificate"],
    steps: [
      { ne: "सम्बन्धित सबै व्यक्तिको कागजात तयार गर्नुहोस्", en: "Collect documents for everyone involved" },
      { ne: "निवेदन फारम भर्नुहोस्", en: "Fill in the application form" },
      { ne: "सबै सम्बन्धित व्यक्ति सहित वडा कार्यालयमा उपस्थित हुनुहोस्", en: "Attend the ward office together with all related persons" },
      { ne: "अभिलेख जाँच तथा प्रमाणित", en: "Record verification and certification" },
      { ne: "नाता प्रमाणित पत्र प्राप्त गर्नुहोस्", en: "Collect the relationship certificate" },
    ],
    docs: [
      { ne: "सम्बन्धित सबैको नागरिकता प्रमाणपत्रको प्रतिलिपि", en: "Copies of citizenship certificates of all related persons" },
      { ne: "जन्म दर्ता वा विवाह दर्ता प्रमाणपत्र", en: "Birth or marriage registration certificate" },
      { ne: "मृत्यु दर्ता प्रमाणपत्र (मृतकसँगको नाताका हकमा)", en: "Death registration certificate (when the relation is to a deceased person)", optional: true },
      { ne: "पासपोर्ट साइजको फोटो", en: "Passport-size photographs" },
    ],
  },
  {
    title_ne: "घर नक्सा पास सम्बन्धी निवेदन",
    title_en: "Building Permit (House Map Approval)",
    description_ne: "नयाँ घर निर्माण वा थपघट गर्नुअघि नक्सा स्वीकृत गराउने निवेदन।",
    description_en: "Application to approve a building drawing before new construction or an extension.",
    about_ne: "भवन ऐन तथा नगरपालिकाको भवन निर्माण मापदण्ड अनुसार घर निर्माण गर्नुअघि नक्सा पास गराउनु अनिवार्य छ। स्वीकृतिपछि मात्र निर्माण सुरु गर्न पाइन्छ।",
    about_en: "Under the building code and municipal standards, a drawing must be approved before construction starts.",
    category: "nirman", section: "yojana-shakha",
    office_ne: "योजना तथा प्राविधिक शाखा", office_en: "Planning & Technical Section",
    fee_ne: "क्षेत्रफल तथा प्रयोजन अनुसार", fee_en: "Based on floor area and use",
    duration_ne: "१५–३५ कार्य दिन", duration_en: "15–35 working days",
    keywords_ne: ["घर नक्सा", "नक्सा पास", "घर बनाउने", "निर्माण", "भवन", "नक्सा"],
    keywords_en: ["building permit", "house map", "map approval", "construction", "naksa pass", "ghar banaune"],
    aliases: ["नक्शा पास", "naksa pass", "building approval", "घर बनाउन अनुमति"],
    steps: [
      { ne: "प्राविधिकबाट नक्सा तयार गराउनुहोस्", en: "Have the drawing prepared by a licensed technician" },
      { ne: "निवेदन तथा नक्सा दर्ता गर्नुहोस्", en: "Register the application together with the drawing" },
      { ne: "प्राविधिक जाँच तथा स्थलगत निरीक्षण", en: "Technical review and site inspection" },
      { ne: "दस्तुर बुझाउनुहोस्", en: "Pay the assessed fee" },
      { ne: "नक्सा स्वीकृति प्राप्त गर्नुहोस्", en: "Receive the approved drawing" },
      { ne: "निर्माण सम्पन्न भएपछि सम्पन्न प्रमाणपत्र लिनुहोस्", en: "Obtain the completion certificate after construction" },
    ],
    docs: [
      { ne: "जग्गा धनी प्रमाण पुर्जाको प्रतिलिपि", en: "Copy of the land ownership certificate" },
      { ne: "नापी नक्सा (ट्रेस नक्सा)", en: "Survey (trace) map" },
      { ne: "इजाजतप्राप्त प्राविधिकले तयार गरेको भवनको नक्सा", en: "Building drawing prepared by a licensed technician" },
      { ne: "घरबाटो सिफारिस", en: "House-road (access) recommendation" },
      { ne: "चालु आर्थिक वर्षको मालपोत तिरेको रसिद", en: "Current fiscal year land revenue receipt" },
      { ne: "निवेदकको नागरिकता प्रमाणपत्रको प्रतिलिपि", en: "Copy of the applicant's citizenship certificate" },
    ],
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
      service.about_ne, service.about_en, service.office_ne, service.office_en,
      ...service.keywords_ne, ...service.keywords_en, ...service.aliases,
    ]);

    const [row] = await sql<{ id: number }[]>`
      INSERT INTO applications (
        slug, title_ne, title_en, description_ne, description_en, about_ne, about_en,
        category_id, section_id, all_wards, office_ne, office_en, fee_ne, fee_en,
        duration_ne, duration_en, keywords_ne, keywords_en, aliases, search_index,
        status, is_sample, online_form_enabled, published_at
      ) VALUES (
        ${slug}, ${service.title_ne}, ${service.title_en}, ${service.description_ne},
        ${service.description_en}, ${service.about_ne}, ${service.about_en},
        ${category?.id ?? null}, ${section?.id ?? null}, TRUE,
        ${service.office_ne}, ${service.office_en}, ${service.fee_ne}, ${service.fee_en},
        ${service.duration_ne}, ${service.duration_en},
        ${service.keywords_ne}, ${service.keywords_en}, ${service.aliases}, ${searchIndex},
        'published', TRUE, ${Boolean(service.online)}, now()
      )
      ON CONFLICT (slug) DO UPDATE SET
        title_ne = EXCLUDED.title_ne, title_en = EXCLUDED.title_en,
        description_ne = EXCLUDED.description_ne, description_en = EXCLUDED.description_en,
        about_ne = EXCLUDED.about_ne, about_en = EXCLUDED.about_en,
        category_id = EXCLUDED.category_id, section_id = EXCLUDED.section_id,
        keywords_ne = EXCLUDED.keywords_ne, keywords_en = EXCLUDED.keywords_en,
        aliases = EXCLUDED.aliases, search_index = EXCLUDED.search_index,
        updated_at = now()
      RETURNING id`;

    await sql`DELETE FROM application_steps WHERE application_id = ${row.id}`;
    await sql`DELETE FROM application_documents WHERE application_id = ${row.id}`;

    for (const [i, step] of service.steps.entries()) {
      await sql`
        INSERT INTO application_steps (application_id, position, title_ne, title_en, description_ne, description_en)
        VALUES (${row.id}, ${i}, ${step.ne}, ${step.en}, ${step.dne ?? ""}, ${step.den ?? ""})`;
    }
    for (const [i, doc] of service.docs.entries()) {
      await sql`
        INSERT INTO application_documents (application_id, position, label_ne, label_en, is_required)
        VALUES (${row.id}, ${i}, ${doc.ne}, ${doc.en}, ${!doc.optional})`;
    }
  }

  return `${SERVICES.length} services, ${CATEGORIES.length} categories, ${SECTIONS.length} sections, ${WARD_COUNT} wards`;
}
