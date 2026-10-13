import type { Metadata, Viewport } from "next";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { site } from "../lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.productName,
  title: { default: "Social-Media | Content that gets approved", template: "%s | Social-Media" },
  description: site.description,
  openGraph: {
    title: "Social-Media — Approval-first content management",
    description: site.description,
    url: site.url,
    siteName: site.productName,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Social-Media", description: site.description },
  robots: { index: site.indexingEnabled, follow: site.indexingEnabled },
};
export const viewport: Viewport = { themeColor: "#07131b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="min-h-screen bg-[#07131b] font-sans text-slate-100 antialiased">
    <a href="#main-content" className="sr-only z-50 rounded bg-emerald-300 px-4 py-3 text-slate-950 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to content</a>
    <SiteHeader/><div id="main-content">{children}</div><SiteFooter/>
  </body></html>;
}
