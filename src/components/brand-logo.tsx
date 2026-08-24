import { cn } from "@/lib/utils";

/** Single source of truth for the brand mark. The file lives in /public/logo.png. */
export const LOGO_SRC = "/logo.png";
const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 48"><rect width="120" height="48" rx="10" fill="#1E3A5F"/><text x="60" y="31" font-family="Inter,sans-serif" font-size="20" font-weight="700" fill="#E67E22" text-anchor="middle">PK</text></svg>`,
  );

export function BrandLogo({
  className,
  alt = "Planned Kid Computer Services logo",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={cn("h-9 w-auto", className)}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src !== FALLBACK) img.src = FALLBACK;
      }}
    />
  );
}
