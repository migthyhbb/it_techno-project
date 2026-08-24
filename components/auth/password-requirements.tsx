import { passwordRules } from "@/lib/validation";

export function PasswordRequirements({ value }: { value: string }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mb-5 -mt-1">
      {passwordRules.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.key}
            className={`flex items-center gap-2 text-xs transition-colors ${
              met ? "text-green" : "text-ink/45"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                met ? "bg-green text-cream" : "bg-forest/8"
              }`}
            >
              {met && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-2.5 h-2.5"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
