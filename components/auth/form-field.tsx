import { InputHTMLAttributes } from "react";

export function FormField({
  label,
  error,
  ...props
}: { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-forest mb-1.5">
        {label}
      </span>
      <input
        {...props}
        className={`w-full rounded-xl border bg-cream/50 px-4 py-3 text-sm text-ink placeholder:text-ink/35 outline-none transition-colors focus:bg-paper ${
          error
            ? "border-red-300 focus:border-red-400"
            : "border-forest/15 focus:border-green"
        }`}
      />
      {error && <span className="block text-xs text-red-600 mt-1.5">{error}</span>}
    </label>
  );
}
