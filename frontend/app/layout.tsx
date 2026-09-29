import type { Metadata } from "next";

import "./globals.css";

import { RegistrationProvider } from "@/features/auth/context/RegistrationContext";
import { CompanyProvider } from "@/features/company/context/CompanyContext";
import { AuthProvider } from "@/features/auth/context/AuthContext";

export const metadata: Metadata = {
  title: "HRMS",
  description: "Modern workforce management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="h-full overflow-hidden">
        <AuthProvider>
          <RegistrationProvider>
            <CompanyProvider>{children}</CompanyProvider>
          </RegistrationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
