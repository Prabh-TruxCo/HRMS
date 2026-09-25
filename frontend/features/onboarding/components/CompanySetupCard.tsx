"use client";

import { Building2, ImagePlus, Upload } from "lucide-react";
import { INDUSTRIES, COMPANY_SIZES, COUNTRIES } from "../constants";

type CompanySetupCardProps = {
  companyName: string;
  industry: string;
  companySize: string;
  country: string;
  logo: File | null;
  brandColor: string;
  onCompanyNameChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
  onCompanySizeChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onLogoChange: (file: File | null) => void;
  onBrandColorChange: (value: string) => void;
};

export default function CompanySetupCard({
  companyName,
  industry,
  companySize,
  country,
  logo,
  brandColor,
  onCompanyNameChange,
  onIndustryChange,
  onCompanySizeChange,
  onCountryChange,
  onLogoChange,
  onBrandColorChange,
}: CompanySetupCardProps) {
  return (
    <section className="rounded-2xl border border-[#E0E5DD] bg-[#FCFCFA] p-6 shadow-[0_8px_30px_rgba(41,43,39,0.04)] sm:p-7">
      {/* Header */}
      <div className="mb-7 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E5EFE2] text-[#5F8F59]">
          <Building2 size={20} />
        </div>

        <div>
          <h2 className="text-[17px] font-semibold text-[#29352A]">
            Company details
          </h2>

          <p className="mt-1 text-[13px] leading-5 text-[#7B8379]">
            Add the basic information for this company. You can configure
            workforce settings later.
          </p>
        </div>
      </div>

      {/* Company Name */}
      <div>
        <label
          htmlFor="companyName"
          className="mb-2 block text-[13px] font-medium text-[#414940]"
        >
          Company name
        </label>

        <input
          id="companyName"
          type="text"
          value={companyName}
          onChange={(event) => onCompanyNameChange(event.target.value)}
          placeholder="e.g. Acme Technologies"
          className="h-11 w-full rounded-xl border border-[#D9DED7] bg-white px-3.5 text-sm text-[#29352A] outline-none transition placeholder:text-[#A2A9A0] focus:border-[#7EA278] focus:ring-4 focus:ring-[#5F8F59]/10"
        />
      </div>

      {/* Business Details */}
      <div className="mt-7 border-t border-[#E8EBE5] pt-7">
        <div className="mb-5">
          <h3 className="text-[14px] font-semibold text-[#414940]">
            Business details
          </h3>

          <p className="mt-1 text-[12px] text-[#8A9288]">
            These details help us provide sensible defaults.
          </p>
        </div>

        {/* Industry */}
        <div>
          <label className="mb-3 block text-[13px] font-medium text-[#414940]">
            Industry
          </label>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {INDUSTRIES.map((item) => {
              const selected = industry === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onIndustryChange(item)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-[12px] font-medium transition ${
                    selected
                      ? "border-[#7EA278] bg-[#EEF5EB] text-[#4E704A]"
                      : "border-[#DDE2DA] bg-white text-[#687067] hover:border-[#B9C8B5] hover:bg-[#F8FAF7]"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Size + Country */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-3 block text-[13px] font-medium text-[#414940]">
              Company size
            </label>

            <div className="flex flex-wrap gap-2">
              {COMPANY_SIZES.map((item) => {
                const selected = companySize === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onCompanySizeChange(item)}
                    className={`rounded-lg border px-3 py-2 text-[11px] font-medium transition ${
                      selected
                        ? "border-[#7EA278] bg-[#EEF5EB] text-[#4E704A]"
                        : "border-[#DDE2DA] bg-white text-[#687067] hover:border-[#B9C8B5]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="country"
              className="mb-3 block text-[13px] font-medium text-[#414940]"
            >
              Country
            </label>

            <select
              id="country"
              value={country}
              onChange={(event) => onCountryChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-[#D9DED7] bg-white px-3 text-sm text-[#29352A] outline-none focus:border-[#7EA278] focus:ring-4 focus:ring-[#5F8F59]/10"
            >
              {COUNTRIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="mt-7 border-t border-[#E8EBE5] pt-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-semibold text-[#414940]">
              Branding
            </h3>

            <p className="mt-1 text-[12px] text-[#8A9288]">
              Optional. You can configure this later from Company Settings.
            </p>
          </div>

          <span className="rounded-full bg-[#F1F2EE] px-2.5 py-1 text-[11px] font-medium text-[#7D857A]">
            Optional
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
          {/* Logo */}
          <label className="group flex min-h-[90px] cursor-pointer items-center gap-4 rounded-xl border border-dashed border-[#CDD5CA] bg-[#FAFBF9] px-4 transition hover:border-[#9DB49A] hover:bg-[#F6F9F5]">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(event) => {
                onLogoChange(event.target.files?.[0] ?? null);
              }}
            />

            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E0E4DD] bg-white">
              {logo ? (
                <ImagePlus size={20} className="text-[#5F8F59]" />
              ) : (
                <ImagePlus size={20} className="text-[#899188]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#4A5248]">
                  {logo ? "Logo selected" : "Upload company logo"}
                </span>

                <Upload size={13} className="text-[#7F897D]" />
              </div>

              <p className="mt-1 text-[11px] text-[#929A90]">
                PNG, JPG, WEBP or SVG
              </p>
            </div>
          </label>

          {/* Brand Color */}
          <div className="rounded-xl border border-[#E0E4DD] bg-white p-4">
            <label className="mb-3 block text-[12px] font-medium text-[#4A5248]">
              Brand color
            </label>

            <div className="flex items-center gap-3">
              <label
                className="relative h-10 w-10 cursor-pointer overflow-hidden rounded-lg border border-[#D7DDD4]"
                style={{ backgroundColor: brandColor }}
              >
                <input
                  type="color"
                  value={brandColor}
                  onChange={(event) =>
                    onBrandColorChange(event.target.value)
                  }
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>

              <span className="font-mono text-[11px] uppercase text-[#899188]">
                {brandColor}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}