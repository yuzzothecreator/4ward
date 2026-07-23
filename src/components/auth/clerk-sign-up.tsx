"use client";

import { SignUp } from "@clerk/nextjs";

export function ClerkSignUp() {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      forceRedirectUrl="/sell"
      fallbackRedirectUrl="/sell"
    />
  );
}
