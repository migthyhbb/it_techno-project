import Image from "next/image";
import { CompanyMark, type CompanyIconType } from "./company-mark";

export function CompanyLogo({
  name,
  logoUrl,
  logoType,
  accent = "green",
  className = "",
}: {
  name: string;
  logoUrl?: string;
  logoType?: CompanyIconType;
  accent?: "gold" | "forest" | "clay" | "green";
  className?: string;
}) {
  if (logoUrl) {
    return (
      <div
        className={`relative rounded-xl overflow-hidden bg-white ring-1 ring-forest/10 shrink-0 ${className}`}
      >
        <Image
          src={logoUrl}
          alt={`Logo ${name}`}
          fill
          sizes="80px"
          className="object-contain p-1"
        />
      </div>
    );
  }

  return (
    <CompanyMark type={logoType ?? "generic"} accent={accent} className={className} />
  );
}
