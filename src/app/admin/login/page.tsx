import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { getLocale, translator } from "@/lib/i18n";
import { getSessionUser } from "@/lib/auth";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = await getLocale();
  const t = translator(locale);
  const sp = await searchParams;
  const raw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = raw && raw.startsWith("/admin") ? raw : "/admin";

  if (await getSessionUser()) redirect(next);

  return (
    <div className="gov-container flex max-w-md flex-col justify-center py-14">
      <div className="gov-card p-6">
        <h1 className="text-[22px] font-bold text-ink-900">{t("admin.login")}</h1>
        <p className="mt-1 text-[14px] text-ink-500">
          {locale === "en" ? site.nameEn : site.nameNe} · {locale === "en" ? site.portalNameEn : site.portalNameNe}
        </p>
        <div className="mt-5">
          <LoginForm
            next={next}
            locale={locale}
            labels={{ email: t("admin.email"), password: t("admin.password"), submit: t("admin.signIn") }}
          />
        </div>
      </div>
      <Link href="/" className="btn-ghost mt-4 self-center">{t("admin.backToPortal")}</Link>
    </div>
  );
}
