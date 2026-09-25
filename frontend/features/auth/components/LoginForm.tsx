"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const switchToSignup = () => {
    setMode("signup");
  };

  const switchToSignin = () => {
    setMode("signin");
  };

  return (
    <section className="flex min-h-[720px] items-center bg-[#FCFCFA] px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
      <div className="mx-auto w-full max-w-[390px]">
        {/* Mobile brand */}
        <div className="flex justify-center lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5F8F59] text-sm font-bold text-white">
            H
          </div>
        </div>

        {/* Mode switch */}
        <div className="mt-2 flex rounded-xl border border-[#E1E4DD] bg-[#F2F3EF] p-1">
          <button
            type="button"
            onClick={switchToSignin}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              mode === "signin"
                ? "bg-white text-[#29352A] shadow-sm"
                : "text-[#747A72] hover:text-[#29352A]"
            }`}
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={switchToSignup}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              mode === "signup"
                ? "bg-white text-[#29352A] shadow-sm"
                : "text-[#747A72] hover:text-[#29352A]"
            }`}
          >
            Create workspace
          </button>
        </div>

        {mode === "signin" ? (
          <SignInForm
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            onCreateWorkspace={switchToSignup}
          />
        ) : (
          <CreateAccount
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onSignIn={switchToSignin}
            onContinue={() => router.push("/setup")}
          />
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Sign In                                                                    */
/* -------------------------------------------------------------------------- */

function SignInForm({
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  onCreateWorkspace,
}: {
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  rememberMe: boolean;
  setRememberMe: React.Dispatch<React.SetStateAction<boolean>>;
  onCreateWorkspace: () => void;
}) {
  return (
    <div className="mt-8">
      <div>
        <p className="text-sm font-medium text-[#5F8F59]">Welcome back</p>

        <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.03em] text-[#29352A]">
          Sign in to your workspace
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#747A72]">
          Manage your people, attendance, tasks and workforce operations.
        </p>
      </div>

      <form className="mt-7 space-y-5">
        <Input label="Work email" type="email" placeholder="you@company.com" />

        <div>
          <label className="mb-2 block text-sm font-medium text-[#40483F]">
            Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="h-11 w-full rounded-xl border border-[#DDE2D9] bg-white px-3.5 pr-11 text-sm text-[#29352A] outline-none transition placeholder:text-[#A0A69E] focus:border-[#7EA579] focus:ring-4 focus:ring-[#5F8F59]/10"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9188] transition hover:text-[#5F8F59]"
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#697067]">
            <button
              type="button"
              onClick={() => setRememberMe((value) => !value)}
              className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                rememberMe
                  ? "border-[#5F8F59] bg-[#5F8F59] text-white"
                  : "border-[#CDD3C9] bg-white"
              }`}
            >
              {rememberMe && <Check className="h-3 w-3" />}
            </button>
            Remember me
          </label>

          <button
            type="button"
            className="text-sm font-medium text-[#5F8F59] hover:text-[#466E42]"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5F8F59] text-sm font-semibold text-white shadow-sm transition hover:bg-[#527E4D]"
        >
          Sign in to workspace
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-7 border-t border-[#E7EAE4] pt-6 text-center">
        <p className="text-sm text-[#747A72]">
          Don&apos;t have a workspace?{" "}
          <button
            type="button"
            onClick={onCreateWorkspace}
            className="font-semibold text-[#5F8F59] hover:text-[#466E42]"
          >
            Create one free
          </button>
        </p>
      </div>

      <p className="mt-6 text-center text-xs leading-5 text-[#9A9F98]">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Create Account                                                             */
/* -------------------------------------------------------------------------- */

function CreateAccount({
  showPassword,
  setShowPassword,
  onSignIn,
  onContinue,
}: {
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  onSignIn: () => void;
  onContinue: () => void;
}) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    /*
     * Organization setup will be handled on /setup.
     *
     * Backend registration will be connected later.
     */
    onContinue();
  };

  return (
    <div className="mt-8">
      <div>
        <p className="text-sm font-medium text-[#5F8F59]">Get started</p>

        <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.03em] text-[#29352A]">
          Create your account
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#747A72]">
          Create your account first. We&apos;ll set up your organization next.
        </p>
      </div>

      <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" placeholder="John" required />

          <Input label="Last name" placeholder="Doe" required />
        </div>

        <Input
          label="Work email"
          type="email"
          placeholder="you@company.com"
          required
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-[#40483F]">
            Password
          </label>

          <div className="relative">
            <input
              required
              minLength={8}
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              className="h-11 w-full rounded-xl border border-[#DDE2D9] bg-white px-3.5 pr-11 text-sm text-[#29352A] outline-none transition placeholder:text-[#A0A69E] focus:border-[#7EA579] focus:ring-4 focus:ring-[#5F8F59]/10"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9188] transition hover:text-[#5F8F59]"
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>

          <p className="mt-1.5 text-xs text-[#969D94]">
            Use at least 8 characters.
          </p>
        </div>

        <button
          type="submit"
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5F8F59] text-sm font-semibold text-white shadow-sm transition hover:bg-[#527E4D]"
        >
          Continue to setup
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-7 border-t border-[#E7EAE4] pt-6 text-center">
        <p className="text-sm text-[#747A72]">
          Already have a workspace?{" "}
          <button
            type="button"
            onClick={onSignIn}
            className="font-semibold text-[#5F8F59] hover:text-[#466E42]"
          >
            Sign in
          </button>
        </p>
      </div>

      <p className="mt-6 text-center text-xs leading-5 text-[#9A9F98]">
        By creating an account, you agree to our Terms of Service and Privacy
        Policy.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Input                                                                      */
/* -------------------------------------------------------------------------- */

function Input({
  label,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#40483F]">
        {label}
      </label>

      <input
        required={required}
        type={type}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-[#DDE2D9] bg-white px-3.5 text-sm text-[#29352A] outline-none transition placeholder:text-[#A0A69E] focus:border-[#7EA579] focus:ring-4 focus:ring-[#5F8F59]/10"
      />
    </div>
  );
}
