export function BackButton({
  children = "Kembali",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="shrink-0 border border-forest/15 text-forest font-medium rounded-full px-5 py-3.5 mt-2 transition-colors hover:bg-forest/5"
    >
      {children}
    </button>
  );
} 

