import type { Metadata } from "next";
import { Orbitron } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import ToastProvider from "@/components/ui/ToastProvider";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
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
      <body className={`${orbitron.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
