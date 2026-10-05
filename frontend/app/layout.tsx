import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

import { AuthProvider } from "@/features/auth/context/AuthContext";
import { RegistrationProvider } from "@/features/auth/context/RegistrationContext";
import { CompanyProvider } from "@/features/company/context/CompanyContext";
import { SnackbarProvider } from "@/components/feedback/SnackbarProvider";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans-custom",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HRMS",
  description: "Modern workforce management platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${font.variable} h-full overflow-hidden`}>
      <body className="h-full overflow-hidden font-sans antialiased">
        <AuthProvider>
          <RegistrationProvider>
            <CompanyProvider>
              <SnackbarProvider>{children}</SnackbarProvider>
            </CompanyProvider>
          </RegistrationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
