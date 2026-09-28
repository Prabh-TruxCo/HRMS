"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SetupPendingCard() {
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-[#DCE6D9] bg-[#F4F8F2] p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DCE9D8] text-[#5F8F59]">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <p className="text-[13px] font-semibold text-[#4E704A]">
              Company setup is pending
            </p>

            <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.02em] text-[#29352A]">
              Complete your company setup
            </h2>

            <p className="mt-1 max-w-xl text-[12px] leading-5 text-[#727A70]">
              Your company is ready, but a few settings are still needed
              before you start managing your workforce.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/company/settings")}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5F8F59] px-4 text-[12px] font-semibold text-white shadow-[0_5px_16px_rgba(95,143,89,0.18)] transition hover:bg-[#527D4D]"
        >
          Continue setup
          <ArrowRight size={15} />
        </button>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-[11px]">
          <span className="font-medium text-[#697169]">
            Setup progress
          </span>
          <span className="font-semibold text-[#557950]">
            40%
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-[#DCE4D9]">
          <div className="h-full w-[40%] rounded-full bg-[#5F8F59]" />
        </div>
      </div>
    </section>
  );
}