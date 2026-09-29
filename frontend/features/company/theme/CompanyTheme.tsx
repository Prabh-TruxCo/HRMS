"use client";

import { useEffect, type ReactNode } from "react";

type CompanyThemeProps = {
  brandColor: string;
  children: ReactNode;
};

export function CompanyTheme({
  brandColor,
  children,
}: CompanyThemeProps) {
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--brand-color",
      brandColor,
    );
  }, [brandColor]);

  return <>{children}</>;
}