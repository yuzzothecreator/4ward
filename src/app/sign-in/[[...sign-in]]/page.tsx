import { ClerkSignIn } from "@/components/auth/clerk-sign-in";
import { DemoSignIn } from "@/components/auth/demo-sign-in";

export const metadata = { title: "Sign in" };

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignInPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      {clerkEnabled ? <ClerkSignIn /> : <DemoSignIn />}
    </div>
  );
}
