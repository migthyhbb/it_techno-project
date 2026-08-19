import { InputHTMLAttributes } from "react";

export function FormField({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-forest mb-1.5">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-xl border border-forest/15 bg-cream/50 px-4 py-3 text-sm text-ink placeholder:text-ink/35 outline-none transition-colors focus:border-green focus:bg-paper"
      />
    </label>
  );
}
