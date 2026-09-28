"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/sessionService";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { setCurrentUser } = useAuth();

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const user = await getCurrentUser();

        if (!isMounted) return;

        setCurrentUser(user);
        setIsChecking(false);
      } catch {
        if (!isMounted) return;

        router.replace("/login");
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router, setCurrentUser]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F0]">
        <div className="text-sm text-[#7B8379]">Loading your workspace...</div>
      </div>
    );
  }

  return <>{children}</>;
}
