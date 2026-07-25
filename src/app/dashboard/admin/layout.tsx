import { RequireRole } from "@/components/auth/require-role";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole
      roles={["ADMIN"]}
      permission="admin:access"
      fallbackHref="/dashboard"
      message="Admin access required."
    >
      {children}
    </RequireRole>
  );
}
