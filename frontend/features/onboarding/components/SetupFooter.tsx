import { ArrowLeft, ArrowRight } from "lucide-react";

type SetupFooterProps = {
  disabled: boolean;
  onBack: () => void;
  onContinue: () => void;
};

export default function SetupFooter({
  disabled,
  onBack,
  onContinue,
}: SetupFooterProps) {
  return (
    <footer className="border-t border-[#E0E4DD] bg-[#FCFCFA]">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#697169] transition hover:bg-[#F0F2EE] hover:text-[#414940]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onContinue}
          className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition ${
            disabled
              ? "cursor-not-allowed bg-[#DDE2DA] text-[#9AA198]"
              : "bg-[#5F8F59] text-white shadow-[0_6px_18px_rgba(95,143,89,0.22)] hover:bg-[#527D4D]"
          }`}
        >
          Continue
          <ArrowRight size={16} />
        </button>
      </div>
    </footer>
  );
}