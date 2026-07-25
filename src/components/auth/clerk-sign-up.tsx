"use client";

import { SignUp } from "@clerk/nextjs";

export function ClerkSignUp() {
  return (
    <SignUp
      routing="hash"
      signInUrl="/sign-in"
      forceRedirectUrl="/sell"
      fallbackRedirectUrl="/sell"
    />
  );
}
