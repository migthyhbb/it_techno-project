import { useRef } from "react";

export function SubmitButton({
  children,
  className = "",
  disabled,
  isSubmitting,
  debounceMs = 600,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isSubmitting?: boolean;
  debounceMs?: number;
}) {
  const lastClickRef = useRef(0);

  const isProcessing = Boolean(disabled || isSubmitting);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();

    if (isProcessing || now - lastClickRef.current < debounceMs) {
      event.preventDefault();
      return;
    }

    lastClickRef.current = now;
    onClick?.(event);
  };

  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      disabled={isProcessing}
      aria-busy={isProcessing}
      onClick={handleClick}
      className={`${className || "w-full"} bg-forest text-cream font-medium rounded-full py-3.5 transition-colors hover:bg-forest-2 disabled:opacity-60 disabled:pointer-events-none`}
    >
      {isProcessing ? "Memproses..." : children}
    </button>
  );
}
