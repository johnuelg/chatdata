import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Zap,
  Clock,
  AlertCircle,
  Timer,
  Layers,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Database,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const AboutSection = () => {
  const { lang, t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const sectionLabel = lang === "ar" ? "من نحن" : "About Us";
  const heading = t("about", "title") || (lang === "ar" ? "عن منصتنا" : "About Our Platform");
  const description = t("about", "description") || (lang === "ar"
    ? "تعمل منصة الذكاء الاصطناعي للمحادثة على تعزيز اتخاذ القرارات المبنية على البيانات في مستشفى الطائف للأطفال من خلال تحويل مؤشرات الأداء والبيانات التشغيلية إلى رؤى فورية وتقارير آلية."
    : "Our Conversational AI Data Platform strengthens data-driven decision-making at Taif Children's Hospital by transforming hospital KPIs and operational data into timely insights and automated reports.");

  const challengeTitle = lang === "ar" ? "التحديات" : "The Challenges";
  const challengeDesc = lang === "ar"
    ? "إعداد التقارير اليدوية التقليدية يستغرق وقتاً طويلاً وعرضة للأخطاء ويخلق اختناقات تشغيلية عبر الأقسام."
    : "Traditional manual report is time-consuming, error-prone, and creates operational bottlenecks across departments. Staff time is spent compiling and checking data, and preparing reports—rather than reviewing performance, improving processes, and running operations efficiently.";
  const challengeItems = lang === "ar"
    ? [
        { icon: Clock, text: "ساعات من العمل اليدوي لكل تقرير" },
        { icon: AlertCircle, text: "عرضة للأخطاء البشرية" },
        { icon: Timer, text: "تأخر في اتخاذ القرارات" },
        { icon: Layers, text: "بيانات متفرقة عبر الأقسام" },
      ]
    : [
        { icon: Clock, text: "Hours of manual work per report" },
        { icon: AlertCircle, text: "Prone to human errors" },
        { icon: Timer, text: "Delayed decision making" },
        { icon: Database, text: "Scattered data across departments" },
      ];

  const solutionTitle = lang === "ar" ? "الحل" : "Our Solutions";
  const solutionDesc = lang === "ar"
    ? "تحدث مع بياناتك ببساطة. اطرح أسئلة بلغة طبيعية للحصول على إجابات فورية وموثوقة وتقارير أداء آلية."
    : "Simply chat with your data. Ask questions in natural language to get instant, reliable answers and automated performance reports from hospital operational data. Our generative AI interprets workflows and KPIs to deliver actionable insights in seconds.";
  const solutionItems = lang === "ar"
    ? [
        { icon: MessageSquare, text: "تحدث لإنشاء تقارير أداء فورية" },
        { icon: ShieldCheck, text: "دقة مدعومة بالذكاء الاصطناعي يمكنك الوثوق بها" },
        { icon: TrendingUp, text: "رؤى أداء في الوقت المناسب" },
        { icon: Database, text: "جميع البيانات في مكان واحد. بدون عزل. بدون تكرار." },
      ]
    : [
        { icon: MessageSquare, text: "Chat to generate instant performance reports" },
        { icon: ShieldCheck, text: "AI-driven accuracy you can trust" },
        { icon: TrendingUp, text: "Timely performance insights" },
        { icon: Database, text: "All data in one place. No silos. No duplication." },
      ];

  const introVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: "easeOut" },
    },
  };

  const leftCardVariants = {
    hidden: { opacity: 0, x: shouldReduceMotion ? 0 : -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.55, ease: "easeOut" },
    },
  };

  const rightCardVariants = {
    hidden: { opacity: 0, x: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.55, ease: "easeOut", delay: shouldReduceMotion ? 0 : 0.06 },
    },
  };

  const listVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.06,
        delayChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const listItemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
  };

  return (
    <section id="about" className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-background to-primary/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/60" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={introVariants}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            {sectionLabel}
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
            {heading}
          </h2>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-loose text-center">
            {description}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* The Challenge */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={leftCardVariants}
            className="group relative bg-card rounded-2xl p-8 lg:p-10 border border-destructive/20 shadow-[var(--card-shadow)] hover:shadow-[var(--card-hover-shadow)] hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden will-change-transform"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 rounded-2xl border-2 border-destructive/0 group-hover:border-destructive/20 transition-all duration-500" />

            <div className="relative z-10 flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-destructive/20 group-hover:rotate-3 transition-all duration-500">
                <AlertTriangle className="h-6 w-6 text-destructive group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground group-hover:text-destructive transition-colors duration-300">
                {challengeTitle}
              </h3>
            </div>

            <p className="relative z-10 text-muted-foreground leading-relaxed mb-8 text-left text-justify group-hover:text-foreground/80 transition-colors duration-300">
              {challengeDesc}
            </p>

            <motion.div
              className="relative z-10 space-y-4 mt-auto"
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
            >
              {challengeItems.map((item, i) => (
                <motion.div
                  key={i}
                  variants={listItemVariants}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-destructive" />
                  </div>
                  {item.text}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Our Solution */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={rightCardVariants}
            className="group relative bg-card rounded-2xl p-8 lg:p-10 border border-primary/20 shadow-[var(--card-shadow)] hover:shadow-[var(--card-hover-shadow)] hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden will-change-transform"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 rounded-2xl border-2 border-primary/0 group-hover:border-primary/20 transition-all duration-500" />

            <div className="relative z-10 flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-primary/20 group-hover:rotate-3 transition-all duration-500">
                <Zap className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                {solutionTitle}
              </h3>
            </div>

            <p className="relative z-10 text-muted-foreground leading-relaxed mb-8 text-left text-justify group-hover:text-foreground/80 transition-colors duration-300">
              {solutionDesc}
            </p>

            <motion.div
              className="relative z-10 space-y-4 mt-auto"
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
            >
              {solutionItems.map((item, i) => (
                <motion.div
                  key={i}
                  variants={listItemVariants}
                  className="flex items-center gap-3 text-sm text-foreground"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  {item.text}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
