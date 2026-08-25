import type { Metadata } from "next";

import "./globals.css";

import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { TenantProvider } from "@/providers/tenant-provider";

export const metadata: Metadata = {
  title: "Identity Platform",
  description: "Identity and access management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <TenantProvider>{children}</TenantProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
