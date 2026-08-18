import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getLocale, translator } from "@/lib/i18n";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: `${site.portalNameNe} | ${site.nameNe}`,
    template: `%s | ${site.nameNe}`,
  },
  description:
    "नगरपालिकाका निवेदन, सिफारिस र फारमहरू एकै ठाउँमा खोज्नुहोस्, डाउनलोड गर्नुहोस् र प्रिन्ट गर्नुहोस्। Search, download and print every municipal application form in one place.",
  icons: { icon: site.logo },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#003893",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = translator(locale);

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-white antialiased">
        <a
          href="#main"
          className="no-print sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-royal-600 focus:px-4 focus:py-2 focus:text-white"
        >
          {t("nav.home")}
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
