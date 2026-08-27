import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-cream">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 w-full">{children}</main>
    </div>
  );
}