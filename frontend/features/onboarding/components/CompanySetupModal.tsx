"use client";

import { useState } from "react";
import { Building2, ImagePlus, X } from "lucide-react";

import { COMPANY_SIZES, COUNTRIES, INDUSTRIES } from "../constants";

import type { CompanySetup } from "../types";

type CompanySetupModalProps = {
  company: CompanySetup | null;
  onClose: () => void;
  onSave: (company: CompanySetup) => void;
};

const EMPTY_COMPANY: CompanySetup = {
  id: "",
  companyName: "",
  industry: "",
  companySize: "",
  country: "India",
  logo: null,
  brandColor: "#5F8F59",
};

export default function CompanySetupModal({
  company,
  onClose,
  onSave,
}: CompanySetupModalProps) {
  const [form, setForm] = useState<CompanySetup>(company ?? EMPTY_COMPANY);

  const canSave =
    form.companyName.trim().length > 0 &&
    form.industry.length > 0 &&
    form.companySize.length > 0 &&
    form.country.length > 0;

  const updateForm = <K extends keyof CompanySetup>(
    field: K,
    value: CompanySetup[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateForm("logo", event.target.files?.[0] ?? null);
  };

  const handleSave = () => {
    if (!canSave) return;

    onSave({
      ...form,
      id: form.id || crypto.randomUUID(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#29352A]/30 px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-[#DDE3DA] bg-[#FCFCFA] shadow-[0_30px_80px_rgba(41,43,39,0.18)]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#E4E8E1] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5EFE2] text-[#5F8F59]">
              <Building2 size={19} />
            </div>

            <div>
              <h2 className="text-[16px] font-semibold text-[#29352A]">
                {company ? "Edit company" : "Add company"}
              </h2>

              <p className="mt-0.5 text-[12px] text-[#7B8379]">
                Add the basic information for this company.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7C857B] transition hover:bg-[#F0F2EE] hover:text-[#414940]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
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
              value={form.companyName}
              onChange={(event) =>
                updateForm("companyName", event.target.value)
              }
              placeholder="e.g. Acme Technologies"
              className="h-11 w-full rounded-xl border border-[#D9DED7] bg-white px-3.5 text-sm text-[#29352A] outline-none transition placeholder:text-[#A2A9A0] focus:border-[#7EA278] focus:ring-4 focus:ring-[#5F8F59]/10"
            />
          </div>

          {/* Industry */}
          <div className="mt-6">
            <label className="mb-3 block text-[13px] font-medium text-[#414940]">
              Industry
            </label>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {INDUSTRIES.map((item) => {
                const selected = form.industry === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => updateForm("industry", item)}
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

            <p className="mt-2 text-[11px] text-[#929A90]">
              Industry only provides sensible defaults. You can customize your
              workspace later.
            </p>
          </div>

          {/* Size + Country */}
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-[13px] font-medium text-[#414940]">
                Company size
              </label>

              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZES.map((item) => {
                  const selected = form.companySize === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => updateForm("companySize", item)}
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
                value={form.country}
                onChange={(event) => updateForm("country", event.target.value)}
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

          {/* Branding */}
          <div className="mt-7 border-t border-[#E8EBE5] pt-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-[14px] font-semibold text-[#414940]">
                  Branding
                </h3>

                <p className="mt-1 text-[12px] text-[#8A9288]">
                  Optional. You can configure this later.
                </p>
              </div>

              <span className="rounded-full bg-[#F1F2EE] px-2.5 py-1 text-[11px] font-medium text-[#7D857A]">
                Optional
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Logo */}
              <label className="flex min-h-[86px] cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#CDD5CA] bg-[#FAFBF9] px-4 transition hover:border-[#9DB49A] hover:bg-[#F6F9F5]">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoChange}
                />

                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E0E4DD] bg-white">
                  <ImagePlus
                    size={19}
                    className={form.logo ? "text-[#5F8F59]" : "text-[#899188]"}
                  />
                </div>

                <div>
                  <p className="text-[12px] font-medium text-[#4A5248]">
                    {form.logo ? "Logo selected" : "Upload company logo"}
                  </p>

                  <p className="mt-1 text-[10px] text-[#929A90]">
                    PNG, JPG, WEBP or SVG
                  </p>
                </div>
              </label>

              {/* Color */}
              <div className="rounded-xl border border-[#E0E4DD] bg-white p-4">
                <label className="mb-3 block text-[12px] font-medium text-[#4A5248]">
                  Brand color
                </label>

                <div className="flex items-center gap-3">
                  <label
                    className="relative h-10 w-10 cursor-pointer overflow-hidden rounded-lg border border-[#D7DDD4]"
                    style={{
                      backgroundColor: form.brandColor,
                    }}
                  >
                    <input
                      type="color"
                      value={form.brandColor}
                      onChange={(event) =>
                        updateForm("brandColor", event.target.value)
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>

                  <span className="font-mono text-[11px] uppercase text-[#899188]">
                    {form.brandColor}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#E4E8E1] bg-[#F8F9F6] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl px-4 text-sm font-medium text-[#697169] transition hover:bg-[#ECEFEA]"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className={`h-10 rounded-xl px-5 text-sm font-semibold transition ${
              canSave
                ? "bg-[#5F8F59] text-white shadow-[0_5px_16px_rgba(95,143,89,0.2)] hover:bg-[#527D4D]"
                : "cursor-not-allowed bg-[#DDE2DA] text-[#9AA198]"
            }`}
          >
            {company ? "Save changes" : "Add company"}
          </button>
        </div>
      </div>
    </div>
  );
}
