import LoginIllustration from "./LoginIllustration";
import LoginForm from "./LoginForm";

export default function LoginCard() {
  return (
    <div className="grid min-h-[720px] w-full max-w-[1240px] overflow-hidden rounded-[28px] border border-[#DFE3DB] bg-white shadow-[0_30px_90px_rgba(41,43,39,0.12)] lg:grid-cols-[1.08fr_0.92fr]">
      <LoginIllustration />
      <LoginForm />
    </div>
  );
}