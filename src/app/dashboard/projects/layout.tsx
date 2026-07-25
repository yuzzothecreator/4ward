import { RequireRole } from "@/components/auth/require-role";

export default function SellerSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["SELLER", "ADMIN"]}
      permission="dashboard:seller"
      fallbackHref="/dashboard"
      message="Seller access required. Publish a project or sign up as a seller."
    >
      {children}
    </RequireRole>
  );
}
