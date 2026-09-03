export default function Loading() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 bg-paper border border-forest/10 p-8 rounded-3xl shadow-xs">
        {/* Spinner Animation */}
        <div className="w-10 h-10 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
        
        {/* Loading Text */}
        <div className="text-center">
          <p className="font-display font-semibold text-forest text-base">
            Memuat Halaman...
          </p>
          <p className="text-xs text-ink/60 font-mono mt-1">
            Harap tunggu sebentar
          </p>
        </div>
      </div>
    </div>
  );
}