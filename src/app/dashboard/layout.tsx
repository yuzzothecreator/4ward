import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardSidebar, DashboardMobileNav } from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth redirectTo="/sign-in">
      <div className="gradient-mesh flex min-h-[calc(100vh-4rem)]">
        <DashboardSidebar />
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <DashboardMobileNav />
          {children}
        </div>
      </div>
    </RequireAuth>
  );
}
