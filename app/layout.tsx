import type { Metadata, Viewport } from "next";
import "./globals.css";

import { SystemSettingsService } from "@/lib/services/systemSettingsService";

export async function generateMetadata(): Promise<Metadata> {
  let siteName = "نظام إدارة المراكز التعليمية والأساتذة";
  let siteLogo = "";

  try {
    const settings = await SystemSettingsService.getSettings();
    if (settings) {
      if (settings.site_name) siteName = settings.site_name;
      if (settings.site_logo) siteLogo = settings.site_logo;
    }
  } catch (error) {
    console.error("Failed to fetch metadata settings:", error);
  }

  return {
    title: siteName !== "نظام إدارة المراكز التعليمية والأساتذة" ? `${siteName}` : siteName,
    description: "نظام إدارة اشتراكات ومجموعات الطلاب للمعلمين",
    icons: siteLogo ? { icon: siteLogo } : undefined
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
