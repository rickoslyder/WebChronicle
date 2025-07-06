import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ActivityStoreProvider } from "@/providers/activity-store-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WebChronicle - Your Personal Web Activity Timeline",
  description: "Track and analyze your web browsing activity with AI-powered insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <ActivityStoreProvider>
            {children}
          </ActivityStoreProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
