// CRITICAL: Validate environment variables before app starts
import '@/lib/config/env-init';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/app-theme.css";
import { AuthProvider } from "../../lib/auth/auth-context";
import { QueryProvider } from "../../lib/providers/query-provider";
import { ErrorBoundary } from "@/components/error-boundary";

// CRITICAL: Force all pages to be dynamic to prevent static generation Html import issue
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "NetPost - AI-Native Reselling Assistant",
  description: "Transform your reselling workflow with intelligent automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning prevents hydration warnings from browser extensions
    // like Moat/Drawbridge that add attributes to the html element
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased netpost-theme gradient-bg`}>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
