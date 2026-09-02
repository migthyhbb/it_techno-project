"use client";

export default function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row relative w-full overflow-x-hidden">
      {children}
    </div>
  );
}