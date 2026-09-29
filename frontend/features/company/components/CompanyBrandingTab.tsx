"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Palette, Save, Upload, X } from "lucide-react";
import Image from "next/image";

import { useCompany } from "@/features/company/context/CompanyContext";
import {
  getCompany,
  updateCompany,
  type CompanyDetail,
} from "@/features/company/services/companyService";
import { uploadCompanyLogo } from "@/features/company/services/companyLogoService";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const DEFAULT_BRAND_COLOR = "#5F8F59";
const MAX_LOGO_SIZE = 2 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

function getLogoUrl(logo: string | null | undefined): string | null {
  if (!logo) {
    return null;
  }

  if (logo.startsWith("http://") || logo.startsWith("https://")) {
    return logo;
  }

  return `${API_URL}${logo}`;
}

export default function CompanyBrandingTab() {
  const { currentCompany } = useCompany();

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentCompany) {
      return;
    }

    let isMounted = true;

    const loadCompany = async () => {
      try {
        setIsLoading(true);
        setError("");

        const result = await getCompany(currentCompany.id);

        if (isMounted) {
          setCompany(result);
        }
      } catch (error) {
        if (isMounted) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load branding settings.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCompany();

    return () => {
      isMounted = false;
    };
  }, [currentCompany]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setMessage("");
    setError("");

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError("Unsupported logo format. Please use PNG, JPG, WEBP, or SVG.");
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setError("Company logo must be smaller than 2 MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreviewUrl = URL.createObjectURL(file);

    setSelectedLogo(file);
    setPreviewUrl(newPreviewUrl);
  };

  const handleRemoveSelectedLogo = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedLogo(null);
    setPreviewUrl(null);

    setMessage("");
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!company || isSaving) {
      return;
    }

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      let updatedCompany = company;

      if (selectedLogo) {
        updatedCompany = await uploadCompanyLogo(company.id, selectedLogo);

        setCompany(updatedCompany);

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setSelectedLogo(null);
        setPreviewUrl(null);
      }

      updatedCompany = await updateCompany(company.id, {
        name: updatedCompany.name,
        legal_name: updatedCompany.legal_name,
        industry_type: updatedCompany.industry_type,
        employee_size: updatedCompany.employee_size,
        country: updatedCompany.country,
        timezone: updatedCompany.timezone,
        color: updatedCompany.color,
        logo: updatedCompany.logo,
      });

      setCompany(updatedCompany);
      setMessage("Branding settings saved successfully.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save branding settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentCompany || isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Loading branding settings...
        </p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-red-600">
          {error || "Unable to load company branding."}
        </p>
      </div>
    );
  }

  const logoUrl = getLogoUrl(company.logo);
  const displayedLogo = previewUrl || logoUrl;
  const brandColor = company.color || DEFAULT_BRAND_COLOR;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
    >
      <div className="border-b border-[var(--border-muted)] px-6 py-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Company Branding
        </h2>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Customize how your company appears across the HRMS.
        </p>
      </div>

      <div className="space-y-8 p-6">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-[var(--brand-color)]" />

            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Company Logo
            </h3>
          </div>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Add your company logo for dashboards, reports, and future documents.
          </p>

          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Logo Preview */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]">
              {displayedLogo ? (
                <Image
                  src={displayedLogo}
                  alt={`${company.name} logo`}
                  width={80}
                  height={80}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <ImageIcon size={32} className="text-[var(--text-muted)]" />
              )}
            </div>

            {/* Upload area */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="company-logo"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--brand-color)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)]"
                >
                  <Upload size={16} />

                  {selectedLogo ? "Change Logo" : "Upload Logo"}

                  <input
                    id="company-logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>

                {selectedLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveSelectedLogo}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
                  >
                    <X size={16} />
                    Remove
                  </button>
                )}
              </div>

              <p className="mt-3 text-xs text-[var(--text-muted)]">
                PNG, JPG, WEBP or SVG · Maximum 2 MB
              </p>

              {selectedLogo && (
                <div className="mt-3 rounded-xl bg-[var(--brand-color-soft)] px-4 py-3">
                  <p
                    className="text-xs font-medium"
                    style={{ color: brandColor }}
                  >
                    New logo selected
                  </p>

                  <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                    {selectedLogo.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Brand Color */}
        <div>
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-[var(--brand-color)]" />

            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Brand Color
            </h3>
          </div>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            This color will be used for company-specific branding throughout the
            application.
          </p>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <input
              type="color"
              value={brandColor}
              onChange={(event) => {
                setCompany({
                  ...company,
                  color: event.target.value,
                });

                setMessage("");
              }}
              className="h-12 w-16 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1"
              aria-label="Company brand color"
            />

            <input
              type="text"
              value={brandColor}
              onChange={(event) => {
                setCompany({
                  ...company,
                  color: event.target.value,
                });

                setMessage("");
              }}
              placeholder={DEFAULT_BRAND_COLOR}
              className="w-full max-w-xs rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm uppercase text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
            />
          </div>
        </div>

        {/* Preview */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Preview
          </h3>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            This is a preview of how the company identity can appear in the
            application.
          </p>

          <div
            className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)]"
            style={{
              borderTopColor: brandColor,
              borderTopWidth: "5px",
            }}
          >
            <div
              className="h-1"
              style={{
                backgroundColor: brandColor,
              }}
            />

            <div className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-muted)]">
                {displayedLogo ? (
                  <Image
                    src={displayedLogo}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span
                    className="text-lg font-bold"
                    style={{
                      color: brandColor,
                    }}
                  >
                    {company.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {company.name}
                </p>

                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Company Workspace
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Save */}
        <div className="flex flex-col gap-4 border-t border-[var(--border-muted)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {message && (
              <div
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: brandColor }}
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  ✓
                </span>

                {message}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed"
            style={{
              backgroundColor: isSaving
                ? "color-mix(in srgb, var(--brand-color), white 45%)"
                : brandColor,
            }}
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : message ? (
              <>
                <span>✓</span>
                Saved
              </>
            ) : (
              <>
                <Save size={17} />
                Save Branding
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
