export function SubmitButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`${className || "w-full"} bg-forest text-cream font-medium rounded-full py-3.5 transition-colors hover:bg-forest-2 disabled:opacity-60 disabled:pointer-events-none`}
    >
      {children}
    </button>
  );
}
