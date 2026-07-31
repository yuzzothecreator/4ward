import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ClerkAuthSync } from "@/components/auth/clerk-auth-sync";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "4ward — Turn Your Projects Into Digital Products",
    template: "%s | 4ward",
  },
  description:
    "4ward helps students and developers sell, showcase, and monetize software projects. The marketplace for academic and personal digital products.",
  keywords: ["marketplace", "student projects", "sell code", "SaaS", "developers"],
};

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-clip bg-background font-sans text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {clerkKey ? <ClerkAuthSync /> : null}
          <Navbar />
          <main className="min-w-0 flex-1 pt-14">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );

  if (clerkKey) {
    return (
      <ClerkProvider
        publishableKey={clerkKey}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInForceRedirectUrl="/welcome"
        signInFallbackRedirectUrl="/welcome"
        signUpForceRedirectUrl="/welcome"
        signUpFallbackRedirectUrl="/welcome"
      >
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
