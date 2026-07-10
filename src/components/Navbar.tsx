import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Bot,
  FileText,
  BarChart3,
  Upload,
  Settings,
  Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings, useIsAdmin } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFirstPermittedPath } from "@/hooks/useNavPermissions";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const { data: isAdmin } = useIsAdmin();
  const { path: firstPermittedPath, loading: navPathLoading } = useFirstPermittedPath();
  const { lang, setLang } = useLanguage();
  const logo = settings?.logo;

  const { data: profile } = useQuery({
    queryKey: ["navbar-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const signedInName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const goToAssignedDashboard = () => {
    navigate(firstPermittedPath ?? "/admin/landing");
  };

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const [isAIOpen, setIsAIOpen] = useState(false);
  const aiMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(e.target as Node)) {
        setIsAIOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { en: "Home", ar: "الرئيسية", href: "#home" },
    { en: "About", ar: "عن المستشفى", href: "#about" },
    { en: "Features", ar: "المميزات", href: "#features" },
    { en: "Domains", ar: "الأقسام", href: "#domains" },
  ];

  const aiSubItems = [
    { en: "Chatbot", ar: "المحادثة الذكية", icon: Bot, href: "#chatbot" },
    { en: "Report Generation", ar: "إنشاء التقارير", icon: FileText, href: "#report-generation" },
    { en: "Document Analytics", ar: "تحليل المستندات", icon: BarChart3, href: "#document-analytics" },
    { en: "Smart Data Uploader", ar: "رفع البيانات الذكي", icon: Upload, href: "#smart-data-uploader" },
  ];

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    setIsMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-card/95 backdrop-blur-md border-b border-border/80"
          : "bg-card/90 backdrop-blur-md border-b border-border/60"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <button
          type="button"
          onClick={() => scrollTo("#home")}
          className="brand-lockup brand-logo-link group"
        >
          {logo?.url ? (
            <img
              src={logo.url}
              alt={logo.alt}
              className="brand-logo brand-logo-header brand-logo-header-hover"
            />
          ) : (
            <img
              src="/images/hospital-logo.svg"
              alt="Taif Children's Hospital"
              className="brand-logo brand-logo-header brand-logo-header-hover"
            />
          )}
          <div className="hidden sm:block leading-tight">
            <span className="block font-heading font-bold text-sm md:text-base text-foreground">
              {lang === "ar" ? "مستشفى الطائف للأطفال" : "Taif Children's Hospital"}
            </span>
            <span className="block text-[10px] md:text-xs text-muted-foreground">
              {lang === "ar" ? "منصة الذكاء الاصطناعي للبيانات" : "Conversational AI Data Platform"}
            </span>
          </div>
        </button>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.en}
              type="button"
              onClick={() => scrollTo(link.href)}
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors duration-300"
            >
              {lang === "ar" ? link.ar : link.en}
            </button>
          ))}
          <div className="relative" ref={aiMenuRef}>
            <button
              onClick={() => setIsAIOpen(!isAIOpen)}
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors duration-300 flex items-center gap-1"
            >
              {lang === "ar" ? "الذكاء الاصطناعي" : "AI"} <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isAIOpen ? "rotate-180" : ""}`} />
            </button>
            {isAIOpen && (
              <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-56 rounded-xl border border-border/70 bg-popover/95 backdrop-blur-md shadow-elegant py-2 animate-in fade-in-0 zoom-in-95 duration-200">
                {aiSubItems.map((item) => (
                  <button
                    key={item.en}
                    type="button"
                    onClick={() => {
                      scrollTo(item.href);
                      setIsAIOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors duration-200"
                  >
                    <item.icon className="w-4 h-4" />
                    {lang === "ar" ? item.ar : item.en}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <div className="hidden md:flex items-center gap-1 bg-secondary/90 rounded-full p-1">
            <button
              onClick={() => setLang("en")}
              className={`px-2 py-1 rounded-full text-[11px] font-bold transition-all duration-300 ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("ar")}
              className={`px-2 py-1 rounded-full text-[11px] font-bold transition-all duration-300 ${lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              AR
            </button>
          </div>
          {/* Theme Toggle */}
          <div className="hidden md:flex items-center gap-1 bg-secondary/80 rounded-full p-1">
            <button
              onClick={() => { if (isDark) toggleTheme(); }}
              className={`p-1.5 rounded-full transition-all duration-300 ${!isDark ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { if (!isDark) toggleTheme(); }}
              className={`p-1.5 rounded-full transition-all duration-300 ${isDark ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
          {isAdmin && (
            <Button variant="ghost" size="icon" className="hidden md:flex hover:bg-primary/10 hover:text-primary" onClick={() => navigate("/admin")}>
              <Settings className="w-4 h-4" />
            </Button>
          )}
          {user ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4 text-xs font-semibold border-border/70 hover:bg-secondary/70"
              onClick={goToAssignedDashboard}
              disabled={navPathLoading}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                <span className="text-muted-foreground">{lang === "ar" ? "متصل:" : "Signed in:"}</span>
                <span className="text-foreground">{signedInName}</span>
              </span>
            </Button>
          ) : (
            <Button
              variant="hero"
              size="sm"
              className="rounded-lg px-5 text-xs font-semibold shadow-elegant hover:shadow-glow"
              onClick={() => navigate("/admin/login")}
            >
              {lang === "ar" ? "دخول" : "Login"}
            </Button>
          )}
          <button
            className="md:hidden text-foreground p-1"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-md border-b border-border/70 animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.en}
                type="button"
                className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 py-2.5 px-3 rounded-lg transition-colors duration-200 text-left"
                onClick={() => scrollTo(link.href)}
              >
                {lang === "ar" ? link.ar : link.en}
              </button>
            ))}
            <div className="border-t border-border/50 pt-2 mt-1">
              <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest px-3 mb-1 block">
                {lang === "ar" ? "ميزات الذكاء الاصطناعي" : "AI Features"}
              </span>
              {aiSubItems.map((item) => (
                <button
                  key={item.en}
                  type="button"
                  className="flex w-full items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 py-2.5 px-3 rounded-lg transition-colors duration-200"
                  onClick={() => scrollTo(item.href)}
                >
                  <item.icon className="w-4 h-4" />
                  {lang === "ar" ? item.ar : item.en}
                </button>
              ))}
            </div>
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="text-sm font-medium text-muted-foreground hover:text-primary py-2.5 px-3 rounded-lg flex items-center gap-2 transition-all duration-200"
            >
              <Globe className="w-4 h-4" />
              {lang === "en" ? "العربية (Arabic)" : "English"}
            </button>
            <button
              onClick={toggleTheme}
              className="text-sm font-medium text-muted-foreground hover:text-primary py-2.5 px-3 rounded-lg flex items-center gap-2 transition-all duration-200"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
            {user && (
              <button
                onClick={goToAssignedDashboard}
                className="text-sm font-medium text-muted-foreground hover:text-primary py-2.5 px-3 rounded-lg transition-all duration-200 text-left"
                disabled={navPathLoading}
              >
                {lang === "ar" ? `متصل: ${signedInName}` : `Signed in: ${signedInName}`}
              </button>
            )}
            {user && (
              <button
                onClick={signOut}
                className="text-sm font-medium text-muted-foreground hover:text-primary py-2.5 px-3 rounded-lg flex items-center gap-2 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                {lang === "ar" ? "خروج" : "Logout"}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
