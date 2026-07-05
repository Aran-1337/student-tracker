import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Tracker | متعقب الطلاب",
  description: "نظام إدارة اشتراكات ومجموعات الطلاب للمعلمين",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
