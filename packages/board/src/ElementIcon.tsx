import type { LucideIcon } from "lucide-react";
import { isIconUrl, resolveLucideIcon } from "./icon-catalog";

export function ElementIcon({
  icon,
  Fallback,
  className,
  alt = "",
}: {
  icon?: string | null;
  Fallback: LucideIcon;
  className?: string;
  alt?: string;
}) {
  if (icon && isIconUrl(icon)) {
    return (
      <img
        src={icon}
        alt={alt}
        className={className}
        style={{ objectFit: "contain" }}
        draggable={false}
      />
    );
  }
  const Lucide = (icon && resolveLucideIcon(icon)) || Fallback;
  return <Lucide className={className} />;
}
