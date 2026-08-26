import { AdminSidebar } from "@/components/dashboard/admin-sidebar"; // Pastikan komponen ini kamu buat ya

export default function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}