"use client";

import {
  CalendarDays,
  ClipboardList,
  Users,
} from "lucide-react";

const summary = [
  {
    label: "Employees",
    value: "0",
    description: "No employees added yet",
    icon: Users,
  },
  {
    label: "Attendance",
    value: "—",
    description: "Not configured",
    icon: ClipboardList,
  },
  {
    label: "On Leave",
    value: "—",
    description: "Leave setup pending",
    icon: CalendarDays,
  },
];

export default function DashboardSummary() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-[16px] font-semibold text-[#29352A]">
          Workforce overview
        </h2>
        <p className="mt-1 text-[12px] text-[#7B8379]">
          A quick look at your company workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summary.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-[#E0E5DD] bg-[#FCFCFA] p-5 shadow-[0_6px_24px_rgba(41,43,39,0.03)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF3EA] text-[#5F8F59]">
                  <Icon size={17} />
                </div>

                <span className="text-[10px] font-medium text-[#A0A79E]">
                  Initial
                </span>
              </div>

              <p className="mt-5 text-[11px] font-medium text-[#7B8379]">
                {item.label}
              </p>

              <p className="mt-1 text-[25px] font-semibold tracking-[-0.03em] text-[#29352A]">
                {item.value}
              </p>

              <p className="mt-1 text-[11px] text-[#929A90]">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}