import { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-16 bg-cream overflow-hidden">
      <div
        aria-hidden
        className="absolute w-[480px] h-[480px] rounded-full bg-green/20 blur-[90px] -top-32 -left-32"
      />
      <div
        aria-hidden
        className="absolute w-[420px] h-[420px] rounded-full bg-gold/20 blur-[90px] -bottom-32 -right-24"
      />

      <div className={`relative w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="bg-paper rounded-3xl border border-forest/10 shadow-[0_30px_60px_-20px_rgba(23,48,31,0.25)] p-8 md:p-10">
          {eyebrow && (
            <p className="font-mono text-xs tracking-widest uppercase text-green mb-3 text-center">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display font-semibold text-2xl md:text-3xl text-forest text-center mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-ink/60 text-sm text-center mb-8 max-w-sm mx-auto">
              {subtitle}
            </p>
          )}
          {!subtitle && <div className="mb-8" />}

          {children}
        </div>

        {footer && <div className="text-center mt-6">{footer}</div>}
      </div>
    </main>
  );
}
