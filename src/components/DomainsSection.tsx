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
  const { t, isRtl } = useLanguage();
  const domains = dbDomains && dbDomains.length > 0
    ? dbDomains.map(d => ({ abbreviation: d.abbreviation, name: d.name, color: d.color, icon: d.icon || "activity" }))
    : fallbackDomains;

  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rafRef = useRef<number | null>(null);
  const snapTimerRef = useRef<number | null>(null);
  const stepRef = useRef(280);

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

  const updateScrollState = useCallback(() => {
    const track = carouselRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    const current = Math.max(0, Math.min(track.scrollLeft, maxScroll));
    const edge = 6;
    setCanScrollLeft(current > edge);
    setCanScrollRight(current < maxScroll - edge);
  }, []);

  const snapToNearestCard = useCallback(() => {
    const track = carouselRef.current;
    if (!track || cardRefs.current.length === 0) return;

    const index = getClosestIndex(track.scrollLeft);
    const target = cardRefs.current[index];
    if (!target) return;

    track.scrollTo({
      left: target.offsetLeft,
      behavior: "smooth",
    });

    setActiveIndex(index);
    updateScrollState();
  }, [getClosestIndex, updateScrollState]);

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
    updateScrollState();
  }, [domains.length, updateScrollState]);

  const scrollByStep = useCallback((direction: "left" | "right") => {
    const track = carouselRef.current;
    if (!track) return;

    const effectiveDirection = isRtl
      ? (direction === "left" ? "right" : "left")
      : direction;
    const delta = effectiveDirection === "left" ? -stepRef.current : stepRef.current;

    track.scrollTo({
      left: track.scrollLeft + delta,
      behavior: "smooth",
    });
  }, [isRtl]);

  const onTrackScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const track = carouselRef.current;
      if (!track || cardRefs.current.length === 0) return;

      const closestIndex = getClosestIndex(track.scrollLeft);

      setActiveIndex((prev) => (prev === closestIndex ? prev : closestIndex));
      updateScrollState();
    });
    snapTimerRef.current = window.setTimeout(() => {
      snapToNearestCard();
    }, 130);
  }, [getClosestIndex, snapToNearestCard, updateScrollState]);

  useEffect(() => {
    const track = carouselRef.current;
    if (!track) return;

    const first = cardRefs.current[0];
    const second = cardRefs.current[1];
    if (first && second) {
      stepRef.current = Math.max(1, second.offsetLeft - first.offsetLeft);
    }

    const onResize = () => {
      const firstCard = cardRefs.current[0];
      const secondCard = cardRefs.current[1];
      if (firstCard && secondCard) {
        stepRef.current = Math.max(1, secondCard.offsetLeft - firstCard.offsetLeft);
      }
      const closestIndex = getClosestIndex(track.scrollLeft);
      setActiveIndex((prev) => (prev === closestIndex ? prev : closestIndex));
      updateScrollState();
    };

    updateScrollState();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [domains.length, getClosestIndex, updateScrollState]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current);
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
        className="group w-[158px] sm:w-[176px] md:w-[188px] lg:w-[198px] shrink-0 snap-center"
      >
        <div className="h-[178px] sm:h-[186px] rounded-2xl border border-border/60 bg-card shadow-[0_8px_20px_-16px_hsl(var(--foreground)/0.28)] transition-all duration-300 group-hover:shadow-[0_16px_30px_-18px_hsl(var(--foreground)/0.26)] group-hover:-translate-y-0.5">
          <div className="h-full flex flex-col items-center justify-center px-3.5 sm:px-4 text-center">
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl border border-border/55 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundColor: `${domain.color}14` }}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" style={{ color: domain.color }} />
            </div>

            <p className="mt-3 font-heading font-bold text-[1.05rem] sm:text-[1.2rem] md:text-[1.3rem] leading-none tracking-tight text-foreground">
              {domain.abbreviation}
            </p>
            <p className="mt-1.5 text-[0.74rem] sm:text-[0.8rem] md:text-[0.84rem] leading-[1.3] text-muted-foreground font-medium min-h-[34px] sm:min-h-[38px] max-w-[150px]">
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
          {canScrollLeft && (
            <button
              onClick={() => scrollByStep("left")}
              aria-label="Previous domain"
              className={`absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-xl border border-border/70 bg-card shadow-[0_8px_18px_-12px_hsl(var(--foreground)/0.35)] items-center justify-center text-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:shadow-[0_12px_24px_-14px_hsl(var(--foreground)/0.4)] hidden md:flex ${isRtl ? "-right-3 lg:-right-5" : "-left-3 lg:-left-5"}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div
            ref={carouselRef}
            onScroll={onTrackScroll}
            className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-1 pb-4 touch-pan-x overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {domains.map((domain, i) => (
              <div
                key={domain.abbreviation}
                className="shrink-0 snap-center"
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
              >
                <DomainCard domain={domain} index={i} />
              </div>
            ))}
          </div>

          {canScrollRight && (
            <button
              onClick={() => scrollByStep("right")}
              aria-label="Next domain"
              className={`absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-xl border border-border/70 bg-card shadow-[0_8px_18px_-12px_hsl(var(--foreground)/0.35)] items-center justify-center text-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:shadow-[0_12px_24px_-14px_hsl(var(--foreground)/0.4)] hidden md:flex ${isRtl ? "-left-3 lg:-left-5" : "-right-3 lg:-right-5"}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <div className="flex justify-center items-center gap-2 mt-6">
            {domains.map((domain, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={`${domain.abbreviation}-${i}`}
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Go to ${domain.name}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${isActive ? "w-8 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/45"}`}
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
