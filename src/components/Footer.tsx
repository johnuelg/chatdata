import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { data: settings } = useSiteSettings();
  const { lang, t } = useLanguage();
  const footer = settings?.footer ?? { name: "Taif Children's Hospital", copyright: "© 2026 Taif Children's Hospital. Smart Reporting. Powered by Intelligent Chat." };
  const logo = settings?.logo;

  const name = t("footer", "name") || (lang === "ar" ? "مستشفى الطائف للأطفال" : footer.name);
  const copyright = t("footer", "copyright") || (lang === "ar" ? "© 2026 مستشفى الطائف للأطفال. تقارير ذكية." : footer.copyright);

  return (
    <footer className="py-10 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="brand-lockup brand-logo-link group focus-visible:ring-2 focus-visible:ring-primary-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
          {logo?.url ? (
            <img src={logo.url} alt={logo.alt} className="brand-logo brand-logo-footer" />
          ) : (
            <img src="/images/hospital-logo.svg" alt="Taif Children's Hospital" className="brand-logo brand-logo-footer" />
          )}
          <span className="font-heading font-semibold text-sm">{name}</span>
        </button>
        <p className="text-xs text-primary-foreground/75 text-center font-medium">{copyright}</p>
      </div>
    </footer>
  );
};

export default Footer;
