import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import ToastProvider from "@/components/ui/ToastProvider";
import AuthErrorRecovery from "@/components/AuthErrorRecovery";
import { validateEnv } from "@/lib/env";

// Validate environment variables at build/startup time
const envCheck = validateEnv();
if (!envCheck.valid) {
  console.error(`Missing required environment variables: ${envCheck.missing.join(', ')}`);
}

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ServiceDraft.AI",
  description: "AI-Powered Warranty Narrative Generator for Automotive Service Departments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${orbitron.variable} ${inter.variable} antialiased`}>
        <AuthErrorRecovery />
        <ThemeProvider>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
