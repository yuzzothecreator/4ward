import { RequireRole } from "@/components/auth/require-role";

export default function SellerOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["SELLER", "ADMIN", "SUPER_ADMIN"]}
      permission="dashboard:seller"
      fallbackHref="/dashboard"
      message="Seller access required."
    >
      {children}
    </RequireRole>
  );
}
