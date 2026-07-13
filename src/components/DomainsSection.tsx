import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDomains } from "@/hooks/useDomains";
import { getIconComponent } from "@/components/admin/settings/DomainIconPicker";
import { useLanguage } from "@/contexts/LanguageContext";

const fallbackDomains = [
  { abbreviation: "ED", name: "Emergency Department", color: "#2f9acb", icon: "ambulance" },
  { abbreviation: "RAD", name: "Radiology", color: "#3ba5d2", icon: "scan-line" },
  { abbreviation: "BB", name: "Blood Bank", color: "#54b3d9", icon: "droplets" },
  { abbreviation: "LAB", name: "Laboratory", color: "#6dc2e0", icon: "microscope" },
  { abbreviation: "NICU", name: "Neonatal Intensive Care Unit", color: "#86d0e7", icon: "baby" },
  { abbreviation: "PICU", name: "Pediatric Intensive Care Unit", color: "#9fdded", icon: "activity" },
  { abbreviation: "CPR", name: "Cardiopulmonary Resuscitation", color: "#2f9acb", icon: "heart-pulse" },
  { abbreviation: "Nursing", name: "Nursing", color: "#3ba5d2", icon: "stethoscope" },
  { abbreviation: "HQI", name: "Health Quality Index", color: "#54b3d9", icon: "award" },
];

const DomainsSection = () => {
  const { data: dbDomains } = useDomains();
  const { t } = useLanguage();
  const domains = dbDomains && dbDomains.length > 0
    ? dbDomains.map(d => ({ abbreviation: d.abbreviation, name: d.name, color: d.color, icon: d.icon || "activity" }))
    : fallbackDomains;

  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rafRef = useRef<number | null>(null);

  const getClosestIndex = useCallback((scrollLeft: number) => {
    let closestIndex = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const distance = Math.abs(card.offsetLeft - scrollLeft);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    cardRefs.current = [];
  }, [domains.length]);

  const scrollToIndex = useCallback((index: number) => {
    if (!domains.length) return;

    const bounded = Math.max(0, Math.min(domains.length - 1, index));
    const track = carouselRef.current;
    const targetCard = cardRefs.current[bounded];

    if (!track || !targetCard) return;

    track.scrollTo({
      left: targetCard.offsetLeft,
      behavior: "smooth",
    });

    setActiveIndex(bounded);
  }, [domains.length]);

  const onTrackScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const track = carouselRef.current;
      if (!track || cardRefs.current.length === 0) return;

      const closestIndex = getClosestIndex(track.scrollLeft);

      setActiveIndex((prev) => (prev === closestIndex ? prev : closestIndex));
    });
  }, [getClosestIndex]);

  useEffect(() => {
    const track = carouselRef.current;
    if (!track) return;

    const onResize = () => {
      const closestIndex = getClosestIndex(track.scrollLeft);
      setActiveIndex((prev) => (prev === closestIndex ? prev : closestIndex));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [getClosestIndex]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const DomainCard = ({ domain, index }: { domain: typeof domains[0]; index: number }) => {
    const Icon = getIconComponent(domain.icon);

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        whileHover={{ y: -4 }}
        className="group w-[174px] sm:w-[188px] md:w-[198px] shrink-0 snap-start"
      >
        <div className="h-[188px] rounded-[1.1rem] border border-border/70 bg-card/95 shadow-[0_12px_24px_-16px_hsl(var(--foreground)/0.2)] backdrop-blur-sm transition-all duration-300 group-hover:shadow-[0_16px_30px_-18px_hsl(var(--foreground)/0.24)] group-hover:border-border">
          <div className="h-full flex flex-col items-center justify-center px-4 text-center">
            <div
              className="w-[56px] h-[56px] rounded-[1rem] border border-border/60 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundColor: `${domain.color}14` }}
            >
              <Icon className="w-6 h-6" style={{ color: domain.color }} />
            </div>

            <p className="mt-3.5 font-heading font-extrabold text-[1.45rem] md:text-[1.55rem] leading-none tracking-tight text-foreground">
              {domain.abbreviation}
            </p>
            <p className="mt-1.5 text-[0.86rem] leading-[1.25] text-muted-foreground font-medium min-h-[42px] max-w-[154px]">
              {t("domain_cards", domain.abbreviation) || domain.name}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section id="domains" className="py-16 md:py-24 relative bg-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            {t("domains", "section_badge") || "Domains"}
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-6xl mb-3 tracking-tight text-foreground">
            {t("domains", "section_title") || "Hospital Domains"}
          </h2>
          <p className="text-muted-foreground text-xl sm:text-2xl font-medium">
            {t("domains", "section_description") || "Empowering every clinical service"}
          </p>
        </motion.div>

        <div className="relative">
          <button
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous domain"
            className="absolute left-0 md:left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-lg border border-border/70 bg-card/95 shadow-[0_10px_24px_-16px_hsl(var(--foreground)/0.35)] flex items-center justify-center text-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground disabled:opacity-35 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={carouselRef}
            onScroll={onTrackScroll}
            className="flex gap-3.5 md:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-11 md:px-14 py-2 touch-pan-x overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollPaddingInline: "2.75rem" }}
          >
            {domains.map((domain, i) => (
              <div
                key={domain.abbreviation}
                className="shrink-0 snap-start"
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
              >
                <DomainCard domain={domain} index={i} />
              </div>
            ))}
          </div>

          <button
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex >= domains.length - 1}
            aria-label="Next domain"
            className="absolute right-0 md:right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-lg border border-border/70 bg-card/95 shadow-[0_10px_24px_-16px_hsl(var(--foreground)/0.35)] flex items-center justify-center text-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground disabled:opacity-35 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex justify-center items-center gap-2 mt-6">
            {domains.map((domain, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={`${domain.abbreviation}-${i}`}
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Go to ${domain.name}`}
                  className={`h-2 rounded-full transition-all duration-300 ${isActive ? "w-9 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/45"}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DomainsSection;
