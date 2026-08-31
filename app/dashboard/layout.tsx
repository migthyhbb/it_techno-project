import { DashboardSidebar } from "@/components/dashboard/sidebar";
import Script from 'next/script';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-cream">
      
      {/* TARUH MESIN MIDTRANS DI SINI BANG 👇 */}
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js" 
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} 
        strategy="afterInteractive" 
      />
      {/* 👆 ================================== 👆 */}

      <DashboardSidebar />
      <main className="flex-1 min-w-0 w-full">{children}</main>
    </div>
  );
}