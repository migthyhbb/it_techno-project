const iconPaths: Record<string, React.ReactNode> = {
  steel: (
    <path d="M4 17h16M4 17v-3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M7 12V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
  ),
  textile: (
    <>
      <ellipse cx="12" cy="6" rx="6" ry="2.2" />
      <ellipse cx="12" cy="18" rx="6" ry="2.2" />
      <path d="M6 6v12M18 6v12" />
    </>
  ),
  chemical: (
    <>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
      <path d="M8 15h8" />
    </>
  ),
  paper: (
    <>
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v4h4" />
      <path d="M9.5 9h2M9.5 12h5M9.5 15h5" />
    </>
  ),
  palm: <path d="M12 3c4 3 6 7 6 10a6 6 0 0 1-12 0c0-3 2-7 6-10z" />,
  electronics: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" />
    </>
  ),
  food: (
    <>
      <path d="M12 21V9" />
      <path d="M12 9c-2-1-3-3-2-5 2 1 3 2 3 4M12 9c2-1 3-3 2-5-2 1-3 2-3 4" />
      <path d="M12 13c-2-1-3-3-2-5 2 1 3 2 3 4M12 13c2-1 3-3 2-5-2 1-3 2-3 4" />
    </>
  ),
  automotive: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M21 12h-3M6 12H3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" />
    </>
  ),
  pharma: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  energy: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />,
  generic: (
    <>
      <path d="M4 21V9l6-4 6 4v12" />
      <path d="M14 21v-8l6 3v5" />
      <path d="M9 9h.01M9 13h.01M9 17h.01" />
    </>
  ),
};

const bgStyle: Record<string, string> = {
  gold: "bg-gold/12",
  forest: "bg-forest/10",
  clay: "bg-clay/10",
  green: "bg-green/10",
};

const fgStyle: Record<string, string> = {
  gold: "text-gold",
  forest: "text-forest",
  clay: "text-clay",
  green: "text-green",
};

export type CompanyIconType = keyof typeof iconPaths;

export function CompanyMark({
  type,
  accent = "green",
  className = "",
}: {
  type: CompanyIconType;
  accent?: "gold" | "forest" | "clay" | "green";
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl shrink-0 ${bgStyle[accent]} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-[55%] h-[55%] ${fgStyle[accent]}`}
      >
        {iconPaths[type] ?? iconPaths.generic}
      </svg>
    </div>
  );
}
