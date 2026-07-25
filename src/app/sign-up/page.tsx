import { Suspense } from "react";
import { ClerkSignUp } from "@/components/auth/clerk-sign-up";
import { DemoSignUp } from "@/components/auth/demo-sign-up";

export const metadata = { title: "Sign up" };

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      {clerkEnabled ? (
        <ClerkSignUp />
      ) : (
        <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
          <DemoSignUp />
        </Suspense>
      )}
    </div>
  );
}
