"use client";

export default function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream w-full">
      {children}
    </div>
  );
}