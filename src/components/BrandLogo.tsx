import { useMemo } from "react";
import { cn } from "@/lib/utils";

type BrandLogoVariant = "header" | "footer";

interface BrandLogoProps {
  src?: string;
  alt: string;
  variant: BrandLogoVariant;
  className?: string;
}

const DEFAULT_LOGO_SRC = "/images/hospital-logo.svg";

const BrandLogo = ({ src, alt, variant, className }: BrandLogoProps) => {
  const logoSrc = src?.trim() || DEFAULT_LOGO_SRC;

  const wrapperClassName = useMemo(
    () =>
      variant === "header"
        ? "brand-logo-shell brand-logo-shell-header"
        : "brand-logo-shell brand-logo-shell-footer",
    [variant],
  );

  const imageClassName = useMemo(
    () =>
      variant === "header"
        ? "brand-logo brand-logo-header brand-logo-header-hover"
        : "brand-logo brand-logo-footer",
    [variant],
  );

  return (
    <span className={cn(wrapperClassName, className)}>
      <img
        src={logoSrc}
        alt={alt}
        className={imageClassName}
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
    </span>
  );
};

export default BrandLogo;