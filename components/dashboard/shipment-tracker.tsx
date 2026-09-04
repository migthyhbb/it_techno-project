export type ShipmentStatus =
  | "menunggu_konfirmasi"
  | "dijadwalkan"
  | "dijemput"
  | "dalam_perjalanan"
  | "tiba_di_fasilitas"
  | "selesai"
  | "dibatalkan";

const stages: { key: ShipmentStatus; label: string }[] = [
  { key: "menunggu_konfirmasi", label: "Menunggu" },
  { key: "dijemput", label: "Dijemput" },
  { key: "dalam_perjalanan", label: "Perjalanan" },
  { key: "tiba_di_fasilitas", label: "Tiba" },
  { key: "selesai", label: "Selesai" },
];

export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  menunggu_konfirmasi: "Menunggu konfirmasi",
  dijadwalkan: "Dijadwalkan",
  dijemput: "Dijemput armada",
  dalam_perjalanan: "Dalam perjalanan ke fasilitas",
  tiba_di_fasilitas: "Tiba di fasilitas",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export function ShipmentTracker({ status }: { status: ShipmentStatus }) {
  if (status === "dibatalkan") {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-full px-3 py-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Dibatalkan
      </div>
    );
  }
  const effectiveStatus = status === "dijadwalkan" ? "menunggu_konfirmasi" : status;
  const currentIndex = stages.findIndex((s) => s.key === effectiveStatus);
  const idx = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="flex items-start">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-start flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5 shrink-0 w-14">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-medium shrink-0 ${
                i < idx
                  ? "bg-green text-cream"
                  : i === idx
                  ? "bg-green text-cream"
                  : "bg-forest/8 text-ink/35"
              }`}
            >
              {i < idx ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-[10px] text-center leading-tight ${
                i <= idx ? "text-forest font-medium" : "text-ink/35"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < stages.length - 1 && (
            <div
              className={`flex-1 h-[2px] mx-0.5 mt-3 ${
                i < idx ? "bg-green" : "bg-forest/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
