"use client";

import Link from "next/link";

export function TermsCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label="Setuju dengan Syarat & Ketentuan dan Kebijakan Privasi"
        onClick={() => onChange(!checked)}
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
          checked ? "bg-green border-green" : "border-forest/25 hover:border-forest/40"
        }`}
      >
        {checked && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3 text-cream"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        )}
      </button>
      <p className="text-sm text-ink/65 leading-relaxed">
        Saya menyetujui{" "}
        <Link
          href="/syarat-ketentuan"
          target="_blank"
          className="text-green font-medium hover:underline"
        >
          Syarat &amp; Ketentuan
        </Link>{" "}
        dan{" "}
        <Link
          href="/kebijakan-privasi"
          target="_blank"
          className="text-green font-medium hover:underline"
        >
          Kebijakan Privasi
        </Link>{" "}
        LENTERA.
      </p>
    </div>
  );
}
