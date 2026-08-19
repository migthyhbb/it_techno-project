export function ProgressSteps({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-1">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-medium transition-colors duration-300 ${
                i <= current ? "bg-green text-cream" : "bg-forest/8 text-ink/35"
              }`}
            >
              {i < current ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-10 md:w-14 h-[2px] mx-1 transition-colors duration-300 ${
                  i < current ? "bg-green" : "bg-forest/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-xs font-mono uppercase tracking-widest text-ink/40 mt-3">
        Langkah {current + 1} dari {steps.length} · {steps[current]}
      </p>
    </div>
  );
}
