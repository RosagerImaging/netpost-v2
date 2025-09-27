import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../../lib/auth/auth-context";
import { QueryProvider } from "../../lib/providers/query-provider";

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
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
