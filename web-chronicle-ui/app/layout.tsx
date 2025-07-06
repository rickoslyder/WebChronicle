import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ActivityStoreProvider } from "@/providers/activity-store-provider";
import { PWAProvider } from "@/components/pwa-provider";
import { PWAInstall } from "@/components/pwa-install";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WebChronicle - Your Personal Web Activity Timeline",
  description: "Track and analyze your web browsing activity with AI-powered insights",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <PWAProvider>
          <QueryProvider>
            <ActivityStoreProvider>
              {children}
              <PWAInstall />
            </ActivityStoreProvider>
          </QueryProvider>
        </PWAProvider>
      </body>
    </html>
  );
}
