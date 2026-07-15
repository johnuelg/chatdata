import { useState, useEffect, useRef } from "react";
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

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardOffsetsRef = useRef<number[]>([]);
  const scrollRafRef = useRef<number>();
  const touchEndTimeoutRef = useRef<number>();

  const updateScrollState = (nextIndex?: number) => {
    const track = scrollRef.current;
    if (!track) return;

    const current = track.scrollLeft;
    const max = track.scrollWidth - track.clientWidth;

    if (typeof nextIndex === "number") {
      setActiveIndex(nextIndex);
    }

    setCanScrollLeft(current > 5);
    setCanScrollRight(current < max - 5);
  };

  const recalcLayout = () => {
    const track = scrollRef.current;
    if (!track) return;

    const cards = track.querySelectorAll<HTMLElement>("[data-domain-card]");

    if (!cards.length) {
      cardOffsetsRef.current = [];
      setActiveIndex(0);
      updateScrollState(0);
      return;
    }

    cardOffsetsRef.current = Array.from(cards).map((card) => card.offsetLeft);

    const current = track.scrollLeft;
    const nearest = cardOffsetsRef.current.reduce(
      (closest, offset, index) => {
        const distance = Math.abs(offset - current);
        if (distance < closest.distance) {
          return { index, distance };
        }
        return closest;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    ).index;

    setActiveIndex(nearest);
    updateScrollState(nearest);
  };

  const scrollToIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
    const track = scrollRef.current;
    if (!track || cardOffsetsRef.current.length === 0) return;

    const clampedIndex = Math.max(0, Math.min(index, cardOffsetsRef.current.length - 1));

    track.scrollTo({
      left: cardOffsetsRef.current[clampedIndex],
      behavior,
    });

    updateScrollState(clampedIndex);
  };

  const syncNearestCard = () => {
    const track = scrollRef.current;
    if (!track || cardOffsetsRef.current.length === 0) return;

    const current = track.scrollLeft;
    const nearest = cardOffsetsRef.current.reduce(
      (closest, offset, index) => {
        const distance = Math.abs(offset - current);
        if (distance < closest.distance) {
          return { index, distance };
        }
        return closest;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    ).index;

    updateScrollState(nearest);
  };

  useEffect(() => {
    recalcLayout();

    const onResize = () => {
      recalcLayout();
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (scrollRafRef.current) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
      if (touchEndTimeoutRef.current) {
        window.clearTimeout(touchEndTimeoutRef.current);
      }
    };
  }, [domains.length]);

  useEffect(() => {
    recalcLayout();
  }, [isRtl]);

  const scroll = (direction: "left" | "right") => {
    const delta = isRtl
      ? (direction === "left" ? 1 : -1)
      : (direction === "left" ? -1 : 1);
    scrollToIndex(activeIndex + delta);
  };

  const handleScroll = () => {
    if (scrollRafRef.current) return;

    scrollRafRef.current = window.requestAnimationFrame(() => {
      syncNearestCard();
      scrollRafRef.current = undefined;
    });
  };

  const handleTouchEnd = () => {
    if (touchEndTimeoutRef.current) {
      window.clearTimeout(touchEndTimeoutRef.current);
    }

    touchEndTimeoutRef.current = window.setTimeout(() => {
      const track = scrollRef.current;
      if (!track || cardOffsetsRef.current.length === 0) return;

      const current = track.scrollLeft;
      const nearest = cardOffsetsRef.current.reduce(
        (closest, offset, index) => {
          const distance = Math.abs(offset - current);
          if (distance < closest.distance) {
            return { index, distance };
          }
          return closest;
        },
        { index: 0, distance: Number.POSITIVE_INFINITY },
      ).index;

      scrollToIndex(nearest);
    }, 80);
  };

  const DomainCard = ({ domain, index }: { domain: typeof domains[0]; index: number }) => {
    const Icon = getIconComponent(domain.icon);

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        whileHover={{ y: -4 }}
        className="group w-[8.25rem] sm:w-36 md:w-40 lg:w-44 shrink-0 snap-start"
      >
        <div className="h-[154px] sm:h-[168px] md:h-[176px] rounded-xl border border-border/60 bg-card shadow-[0_8px_20px_-16px_hsl(var(--foreground)/0.24)] transition-all duration-300 group-hover:shadow-[0_14px_26px_-18px_hsl(var(--foreground)/0.24)] group-hover:-translate-y-0.5">
          <div className="h-full flex flex-col items-center justify-center px-3 sm:px-3.5 md:px-4 text-center">
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl border border-border/55 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundColor: `${domain.color}14` }}
            >
              <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6" style={{ color: domain.color }} />
            </div>

            <p className="mt-2.5 font-heading font-extrabold text-[0.95rem] sm:text-[1.04rem] md:text-[1.12rem] leading-none tracking-tight text-foreground">
              {domain.abbreviation}
            </p>
            <p className="mt-1 text-[0.7rem] sm:text-[0.76rem] md:text-[0.8rem] leading-[1.3] text-muted-foreground font-medium min-h-[30px] sm:min-h-[34px] max-w-[130px]">
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
            onClick={() => scroll("left")}
            aria-label="Previous domain"
            disabled={!canScrollLeft}
            className={`absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-lg border border-border/70 bg-card shadow-[0_8px_18px_-12px_hsl(var(--foreground)/0.35)] items-center justify-center text-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:shadow-[0_12px_24px_-14px_hsl(var(--foreground)/0.4)] hidden md:flex ${isRtl ? "-right-3 lg:-right-5" : "-left-3 lg:-left-5"} ${canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onTouchEnd={handleTouchEnd}
            className="flex gap-2.5 sm:gap-3 md:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-1 pb-4 touch-pan-x md:touch-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {domains.map((domain, i) => (
              <div
                key={domain.abbreviation}
                className="shrink-0 snap-start"
                data-domain-card
              >
                <DomainCard domain={domain} index={i} />
              </div>
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            aria-label="Next domain"
            disabled={!canScrollRight}
            className={`absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-lg border border-border/70 bg-card shadow-[0_8px_18px_-12px_hsl(var(--foreground)/0.35)] items-center justify-center text-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:shadow-[0_12px_24px_-14px_hsl(var(--foreground)/0.4)] hidden md:flex ${isRtl ? "-left-3 lg:-left-5" : "-right-3 lg:-right-5"} ${canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default DomainsSection;
