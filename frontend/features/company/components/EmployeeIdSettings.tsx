"use client";

import { useEffect, useState } from "react";
import { useCompany } from "@/features/company/context/CompanyContext";

type EmployeeIdSettingsData = {
  company_id: number;
  prefix: string;
  next_number: number;
  number_padding: number;
};

export default function EmployeeIdSettings() {
  const { currentCompany } = useCompany();

  const [prefix, setPrefix] = useState("EMP/26/");
  const [nextNumber, setNextNumber] = useState("1");
  const [padding, setPadding] = useState("4");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const companyId = currentCompany?.id;

    if (!companyId) {
      return;
    }

    const controller = new AbortController();

    async function loadSettings() {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/companies/${companyId}/employees/id-settings`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(
            data?.detail || "Unable to load Employee ID settings.",
          );
        }

        const data: EmployeeIdSettingsData = await response.json();

        setPrefix(data.prefix);
        setNextNumber(String(data.next_number));
        setPadding(String(data.number_padding));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load Employee ID settings.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => controller.abort();
  }, [currentCompany?.id]);

  async function handleSave() {
    if (!currentCompany?.id) return;

    const cleanPrefix = prefix.trim();
    const number = Number(nextNumber);
    const digits = Number(padding);

    if (!cleanPrefix) {
      setError("Please enter an employee ID prefix.");
      return;
    }

    if (cleanPrefix.length > 30) {
      setError("Prefix cannot exceed 30 characters.");
      return;
    }

    if (!Number.isSafeInteger(number) || number < 1) {
      setError("Next number must be a positive whole number.");
      return;
    }

    if (!Number.isInteger(digits) || digits < 1 || digits > 12) {
      setError("Number padding must be between 1 and 12.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/companies/${currentCompany.id}/employees/id-settings`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prefix: cleanPrefix,
            next_number: number,
            number_padding: digits,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Unable to save Employee ID settings.");
      }

      const savedSettings = data as EmployeeIdSettingsData;

      setPrefix(savedSettings.prefix);
      setNextNumber(String(savedSettings.next_number));
      setPadding(String(savedSettings.number_padding));
      setMessage("Employee ID settings saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save Employee ID settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!currentCompany) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        Select a company to manage Employee ID settings.
      </div>
    );
  }

  const previewNumber = Number(nextNumber);
  const previewPadding = Number(padding);

  const preview =
    prefix.trim() &&
    Number.isSafeInteger(previewNumber) &&
    previewNumber > 0 &&
    Number.isInteger(previewPadding) &&
    previewPadding >= 1 &&
    previewPadding <= 12
      ? `${prefix.trim()}${String(previewNumber).padStart(previewPadding, "0")}`
      : "—";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Employee ID Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure how employee IDs are generated for {currentCompany.name}.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading settings...</p>
        ) : (
          <div className="space-y-5">
            <div>
              <label
                htmlFor="employee-id-prefix"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Employee ID prefix
              </label>

              <input
                id="employee-id-prefix"
                value={prefix}
                onChange={(event) => setPrefix(event.target.value)}
                maxLength={30}
                placeholder="e.g. EMP/26/"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Enter the complete fixed prefix, including any separators or
                year. For example:
                <span className="font-medium text-gray-700">
                  {" "}
                  EMP/26/, TRX-26-, or ABC/HR/.
                </span>{" "}
                The next number is appended automatically. Avoid entering the
                changing employee number in the prefix.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="employee-id-next-number"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Next number
                </label>

                <input
                  id="employee-id-next-number"
                  type="number"
                  min={1}
                  step={1}
                  value={nextNumber}
                  onChange={(event) => setNextNumber(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                />

                <p className="mt-1 text-xs text-gray-500">
                  The next number to be assigned to a new employee.
                </p>
              </div>

              <div>
                <label
                  htmlFor="employee-id-padding"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Number padding
                </label>

                <input
                  id="employee-id-padding"
                  type="number"
                  min={1}
                  max={12}
                  step={1}
                  value={padding}
                  onChange={(event) => setPadding(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                />

                <p className="mt-1 text-xs text-gray-500">
                  5 digits means 00101 for number 101.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-600">
                Next employee ID preview
              </p>

              <p className="mt-1 break-all text-2xl font-semibold tracking-wide text-gray-900">
                {preview}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Preview only. The actual number is allocated by the backend.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            {message && (
              <p role="status" className="text-sm text-green-700">
                {message}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Before changing the next number
        </p>

        <p className="mt-1 text-sm text-amber-800">
          Choose a number that will not generate an ID already assigned to an
          employee. Changing the prefix or padding affects future IDs only;
          existing employee IDs should remain unchanged.
        </p>
      </div>
    </div>
  );
}
