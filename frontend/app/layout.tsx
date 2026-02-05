import React from "react"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import StoreProvider from "@/state/provider";
import AuthInitializer from "@/components/auth-initializer";
import AppShell from "@/components/app-shell";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Evora - Event Management",
  description: "Discover and manage events with Evora",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <StoreProvider>
          <AuthInitializer>
            <AppShell>{children}</AppShell>
          </AuthInitializer>
        </StoreProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
