import { Check } from "lucide-react";

export default function SetupProgress() {
  return (
    <div className="shrink-0 border-b border-[#E4E7E1] bg-[#F8F9F6]">
      <div className="mx-auto flex w-full max-w-[1180px] items-center px-5 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <StepItem label="Workspace" completed />

          <div className="h-px w-8 bg-[#5F8F59]" />

          <StepItem label="Companies" active />
        </div>
      </div>
    </div>
  );
}

function StepItem({
  label,
  active = false,
  completed = false,
}: {
  label: string;
  active?: boolean;
  completed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
          active || completed
            ? "bg-[#5F8F59] text-white"
            : "bg-[#E3E7E1] text-[#8B9389]"
        }`}
      >
        {completed ? <Check size={11} strokeWidth={3} /> : "02"}
      </span>

      <span
        className={`text-[12px] font-medium ${
          active ? "text-[#4E704A]" : "text-[#969D94]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}