import { motion, useReducedMotion } from "framer-motion";
import { MessageSquare, FileText, FileSearch, LayoutGrid } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const featureKeys = [
  { icon: MessageSquare, titleKey: "chatbot_title", descKey: "chatbot_description", color: "primary" as const },
  { icon: FileText, titleKey: "report_title", descKey: "report_description", color: "teal" as const },
  { icon: FileSearch, titleKey: "document_title", descKey: "document_description", color: "amber" as const },
  { icon: LayoutGrid, titleKey: "dashboard_title", descKey: "dashboard_description", color: "coral" as const },
];

const colorMap = {
  primary: "bg-primary/10 text-primary",
  teal: "bg-primary/10 text-primary",
  amber: "bg-primary/10 text-primary",
  coral: "bg-primary/10 text-primary",
};

const borderColorMap = {
  primary: "hover:border-primary/30",
  teal: "hover:border-primary/30",
  amber: "hover:border-primary/30",
  coral: "hover:border-primary/30",
};

const AIFeaturesSection = () => {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const introInitial = shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 };
  const introWhileInView = { opacity: 1, y: 0 };
  const cardInitial = shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 };
  const cardWhileInView = { opacity: 1, y: 0 };

  return (
    <section id="features" className="py-20 md:py-32 relative bg-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={introInitial}
          whileInView={introWhileInView}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.55 }}
          className="text-center mb-14 md:mb-20"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            {t("ai_features", "section_badge") || "Features"}
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl mb-6 tracking-tight">
            {t("ai_features", "section_title") || "AI Features"}
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-base md:text-lg leading-loose font-body">
            {t("ai_features", "section_description") || "We've got a new AI setup that's here to make life easier when it comes to tracking hospital KPIs."}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {featureKeys.map((feature, i) => (
            <motion.div
              key={feature.titleKey}
              initial={cardInitial}
              whileInView={cardWhileInView}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: shouldReduceMotion ? 0 : i * 0.08, duration: 0.45 }}
              className={`group relative rounded-2xl border border-border/50 bg-card p-8 shadow-sm hover:shadow-elegant hover:-translate-y-1.5 transition-all duration-500 overflow-hidden will-change-transform ${borderColorMap[feature.color]}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl ${colorMap[feature.color]} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-bold text-xl md:text-2xl mb-4 tracking-tight group-hover:text-primary transition-colors duration-300">
                  {t("ai_features", feature.titleKey)}
                </h3>
                <p className="text-muted-foreground text-base leading-relaxed font-body group-hover:text-foreground/80 transition-colors duration-300">
                  {t("ai_features", feature.descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIFeaturesSection;
