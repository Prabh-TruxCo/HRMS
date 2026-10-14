
"use client";

import { useRouter } from "next/navigation";

type ModuleNotEnabledProps = {
  moduleName: string;
};

export default function ModuleNotEnabled({
  moduleName,
}: ModuleNotEnabledProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <svg
            className="h-7 w-7 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.7}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-gray-900">
          {moduleName} Not Enabled
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-600">
          The {moduleName.toLowerCase()} module is not enabled for your
          currently selected organization.
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Contact your administrator to enable this module if you need access.
        </p>

        <button
          type="button"
          onClick={() => router.replace("/organization")}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          Back to Organization Overview
        </button>
      </div>
    </div>
  );
}
