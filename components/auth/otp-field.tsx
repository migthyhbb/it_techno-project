export function OtpField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="mb-4">
      <span className="block text-sm font-medium text-forest mb-1.5">
        Kode verifikasi
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        className={`w-full rounded-xl border bg-cream/50 px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-forest placeholder:text-ink/20 outline-none transition-colors focus:bg-paper ${
          error
            ? "border-red-300 focus:border-red-400"
            : "border-forest/15 focus:border-green"
        }`}
      />
      {error && <span className="block text-xs text-red-600 mt-1.5">{error}</span>}
    </div>
  );
}
