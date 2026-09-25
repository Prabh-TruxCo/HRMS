"use client";

import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Users,
} from "lucide-react";

const capabilities: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: "green" | "gold" | "olive";
}[] = [
  {
    icon: Clock3,
    title: "Attendance",
    description: "Shifts & presence",
    color: "green",
  },
  {
    icon: CalendarDays,
    title: "Leave",
    description: "Requests & policies",
    color: "gold",
  },
  {
    icon: Users,
    title: "People",
    description: "Employee records",
    color: "olive",
  },
  {
    icon: ClipboardCheck,
    title: "Tasks",
    description: "Workforce operations",
    color: "green",
  },
  {
    icon: BarChart3,
    title: "Reports",
    description: "Workforce insights",
    color: "gold",
  },
  {
    icon: CheckCircle2,
    title: "Assets",
    description: "Company resources",
    color: "olive",
  },
];

export default function LoginIllustration() {
  return (
    <section className="relative hidden min-h-[720px] overflow-hidden bg-[#EEF3EA] lg:flex">
      {/* --------------------------------------------------
          BACKGROUND
      -------------------------------------------------- */}

      {/* Soft green glow */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#A8C79F]/25 blur-[100px]" />

      {/* Warm gold glow */}
      <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-[#C8AC72]/15 blur-[100px]" />

      {/* Very subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#53624F 1px, transparent 1px), linear-gradient(90deg, #53624F 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Decorative circles */}
      <div className="absolute right-[-70px] top-[110px] h-44 w-44 rounded-full border border-[#7C9D75]/10" />

      <div className="absolute right-[-30px] top-[150px] h-28 w-28 rounded-full border border-[#C8AC72]/10" />

      {/* --------------------------------------------------
          CONTENT
      -------------------------------------------------- */}

      <div className="relative z-10 flex w-full flex-col p-10 xl:p-12">
        {/* ------------------------------------------------
            BRAND
        ------------------------------------------------ */}

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5F8F59] text-sm font-bold text-white shadow-[0_8px_20px_rgba(95,143,89,0.22)]">
            H
          </div>

          <div>
            <p className="text-sm font-semibold tracking-tight text-[#29352A]">
              HRMS
            </p>

            <p className="text-[11px] text-[#788176]">Workforce management</p>
          </div>
        </div>

        {/* ------------------------------------------------
            HERO
        ------------------------------------------------ */}

        <div className="mt-16 max-w-[530px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5F8F59]">
            Multi-tenant workforce platform
          </p>

          <h1 className="mt-4 text-[42px] font-semibold leading-[1.06] tracking-[-0.035em] text-[#29352A] xl:text-[48px]">
            One platform,
            <br />
            <span className="text-[#5F8F59]">every workforce.</span>
          </h1>

          <p className="mt-5 max-w-[455px] text-[14px] leading-6 text-[#687168]">
            Manage people, attendance, leave, tasks and workforce operations
            from one connected workspace.
          </p>
        </div>

        {/* ------------------------------------------------
            CAPABILITY CARDS
        ------------------------------------------------ */}

        <div className="mt-12 grid max-w-[610px] grid-cols-2 gap-3 xl:grid-cols-3">
          {capabilities.map((item, index) => (
            <CapabilityCard key={item.title} {...item} delay={index * 80} />
          ))}
        </div>

        {/* ------------------------------------------------
            WORKSPACE PREVIEW
        ------------------------------------------------ */}

        <div className="mt-8 max-w-[610px] rounded-2xl border border-[#D8E1D4] bg-white/75 p-4 shadow-[0_12px_35px_rgba(73,91,67,0.06)] backdrop-blur-sm">
          {/* Header */}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#98A194]">
                Workspace
              </p>

              <p className="mt-1 text-xs font-medium text-[#485247]">
                Everything connected in one place
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[#D8E7D4] bg-[#F0F7EE] px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#69A260]" />

              <span className="text-[9px] font-medium text-[#5F8F59]">
                Connected
              </span>
            </div>
          </div>

          {/* Metrics */}

          <div className="mt-4 grid grid-cols-3 gap-3">
            <MiniMetric
              icon={<Users size={14} />}
              label="Employees"
              value="People"
            />

            <MiniMetric
              icon={<Clock3 size={14} />}
              label="Attendance"
              value="Daily"
            />

            <MiniMetric
              icon={<BarChart3 size={14} />}
              label="Operations"
              value="Connected"
            />
          </div>
        </div>

        {/* ------------------------------------------------
            BOTTOM
        ------------------------------------------------ */}

        <div className="mt-auto flex items-center justify-between pt-8">
          <div className="flex items-center gap-2 text-[11px] text-[#899287]">
            <span className="h-px w-6 bg-[#BFC8BA]" />

            <span>Built for modern teams</span>
          </div>

          <div className="hidden items-center gap-1.5 text-[10px] text-[#9AA198] xl:flex">
            <span>Flexible</span>
            <span>•</span>
            <span>Configurable</span>
            <span>•</span>
            <span>Multi-company</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   CAPABILITY CARD
========================================================= */

function CapabilityCard({
  icon: Icon,
  title,
  description,
  color,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: "green" | "gold" | "olive";
  delay: number;
}) {
  const styles = {
    green: {
      icon: "bg-[#E7F1E4] text-[#5F8F59]",
      border: "hover:border-[#B7D0B1]",
      background: "hover:bg-[#FBFDF9]",
    },

    gold: {
      icon: "bg-[#F4EDDF] text-[#A88952]",
      border: "hover:border-[#DDCBA5]",
      background: "hover:bg-[#FFFDF8]",
    },

    olive: {
      icon: "bg-[#E9EEE5] text-[#74846C]",
      border: "hover:border-[#C8D2C3]",
      background: "hover:bg-[#FBFCFA]",
    },
  };

  return (
    <div
      style={{
        animationDelay: `${delay}ms`,
      }}
      className={`group cursor-default rounded-2xl border border-[#DCE3D9] bg-white/80 p-4 shadow-[0_5px_18px_rgba(73,91,67,0.035)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(73,91,67,0.09)] ${styles[color].border} ${styles[color].background}`}
    >
      {/* Icon */}

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[color].icon}`}
      >
        <Icon size={17} />
      </div>

      {/* Text */}

      <div className="mt-4 flex items-start justify-between">
        <div>
          <p className="text-[13px] font-semibold text-[#414A3F]">{title}</p>

          <p className="mt-1 text-[10px] text-[#899187]">{description}</p>
        </div>

        <ArrowUpRight
          size={13}
          className="text-[#C0C8BC] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#6B8566]"
        />
      </div>
    </div>
  );
}

/* =========================================================
   MINI METRIC
========================================================= */

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#E1E7DE] bg-[#F8FAF7] px-3 py-3 transition-colors hover:bg-white">
      <div className="flex items-center gap-2 text-[#7C8978]">
        {icon}

        <p className="text-[9px]">{label}</p>
      </div>

      <p className="mt-1.5 text-[11px] font-semibold text-[#4D584A]">{value}</p>
    </div>
  );
}
