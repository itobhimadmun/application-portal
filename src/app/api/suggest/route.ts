import { NextResponse, type NextRequest } from "next/server";
import { searchApplications } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ items: [] });

  try {
    const { items } = await searchApplications({ q, perPage: 6 });
    return NextResponse.json({
      items: items.map((a) => ({
        slug: a.slug,
        title_ne: a.title_ne,
        title_en: a.title_en,
        section_ne: a.section_name_ne,
        section_en: a.section_name_en,
      })),
    });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
