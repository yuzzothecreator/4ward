import { RequireRole } from "@/components/auth/require-role";

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["SUPPORT", "ADMIN", "SUPER_ADMIN"]}
      permission="support:access"
      fallbackHref="/dashboard"
      message="Customer desk access required."
    >
      {children}
    </RequireRole>
  );
}
