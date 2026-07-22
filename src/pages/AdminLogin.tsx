import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Lock, Globe, Heart, Star, Stethoscope, Baby, Syringe, Pill, Link2, Shield } from "lucide-react";

type Lang = "en" | "ar";

const translations = {
  en: {
    title: "Healthcare Providers Login",
    subtitle: "Sign in with your authorized credentials",
    email: "Email Address",
    emailPlaceholder: "admin@example.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    remember: "Remember me",
    signIn: "Sign In",
    signingIn: "Signing in...",
    notice: "Access is restricted to authorized personnel only. Contact your administrator if you need an account.",
    powered: "Powered by Taif AI Healthcare Intelligence System",
    denied: "Access Denied",
    deniedDesc: "You do not have an authorized role. Contact your administrator.",
    loginFailed: "Login Failed",
    welcome: "Welcome back!",
    langLabel: "العربية",
    hospitalName: "Taif Children's Hospital",
    hospitalNameAr: "مستشفى الطائف للأطفال",
  },
  ar: {
    title: "تسجيل دخول مقدمي الرعاية الصحية",
    subtitle: "قم بتسجيل الدخول باستخدام بيانات الاعتماد المعتمدة",
    email: "البريد الإلكتروني",
    emailPlaceholder: "admin@example.com",
    password: "كلمة المرور",
    passwordPlaceholder: "أدخل كلمة المرور",
    remember: "تذكرني",
    signIn: "تسجيل الدخول",
    signingIn: "جارٍ تسجيل الدخول...",
    notice: "الوصول مقتصر على الموظفين المصرح لهم فقط. تواصل مع المسؤول إذا كنت بحاجة إلى حساب.",
    powered: "مدعوم من نظام الطائف للذكاء الاصطناعي في الرعاية الصحية",
    denied: "تم رفض الوصول",
    deniedDesc: "ليس لديك دور مصرح به. تواصل مع المسؤول.",
    loginFailed: "فشل تسجيل الدخول",
    welcome: "مرحباً بعودتك!",
    langLabel: "English",
    hospitalName: "Taif Children's Hospital",
    hospitalNameAr: "مستشفى الطائف للأطفال",
  },
};

const FloatingIcon = ({ icon: Icon, className }: { icon: any; className: string }) => (
  <div className={`absolute text-primary/25 animate-float ${className}`}>
    <Icon className="w-10 h-10" />
  </div>
);

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const { toast, dismiss } = useToast();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: settings } = useSiteSettings();
  const welcomedUserIdRef = useRef<string | null>(null);

  const t = translations[lang];
  const isRtl = lang === "ar";

  // Get login page customization from site settings
  const loginSettings = (settings as any)?.login_page ?? {};
  const bgImage = loginSettings.bg_image || "/images/login-bg.png";
  const loginLogo = settings?.logo?.url || "/images/hospital-logo.svg";
  const loginLogoAlt = settings?.logo?.alt || "Hospital Logo";
  const loginTitle = loginSettings.title_en || t.hospitalName;
  const loginTitleAr = loginSettings.title_ar || t.hospitalNameAr;

  const getDisplayName = (emailValue?: string | null, fullNameValue?: string | null) => {
    return fullNameValue?.trim() || emailValue?.split("@")[0] || "User";
  };

  const validateRoleAccess = async (userId: string) => {
    const [adminRoleResult, customRoleResult] = await Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle(),
      supabase
        .from("user_custom_roles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    if (adminRoleResult.error) throw adminRoleResult.error;
    if (customRoleResult.error) throw customRoleResult.error;

    return !!adminRoleResult.data || (customRoleResult.count ?? 0) > 0;
  };

  useEffect(() => {
    const handleExistingSession = async () => {
      if (!session?.user) return;

      const userId = session.user.id;
      if (welcomedUserIdRef.current === userId) {
        navigate("/admin/landing", { replace: true });
        return;
      }

      try {
        const hasAccess = await validateRoleAccess(userId);
        if (!hasAccess) {
          await supabase.auth.signOut();
          return;
        }

        dismiss();
        toast({
          title: `${lang === "ar" ? "مرحبًا" : "Welcome"}, ${getDisplayName(session.user.email, session.user.user_metadata?.full_name)}`,
        });
        welcomedUserIdRef.current = userId;
        navigate("/admin/landing", { replace: true });
      } catch {
        await supabase.auth.signOut();
      }
    };

    handleExistingSession();
  }, [session, navigate, toast, dismiss, lang]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Login failed");

      const hasAccess = await validateRoleAccess(user.id);

      if (!hasAccess) {
        await supabase.auth.signOut();
        toast({ title: t.denied, description: t.deniedDesc, variant: "destructive" });
        return;
      }

      dismiss();
      toast({ title: `${lang === "ar" ? "مرحبًا" : "Welcome"}, ${getDisplayName(user.email, user.user_metadata?.full_name)}` });
      welcomedUserIdRef.current = user.id;
      navigate("/admin/landing", { replace: true });
    } catch (error: any) {
      toast({ title: t.loginFailed, description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative flex flex-col bg-primary-ice`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-primary/10" />

      {/* Floating medical icons */}
      <FloatingIcon icon={Heart} className="top-[10%] left-[10%]" />
      <FloatingIcon icon={Star} className="top-[15%] left-[14%]" />
      <FloatingIcon icon={Stethoscope} className="top-[8%] right-[5%]" />
      <FloatingIcon icon={Baby} className="top-[6%] right-[20%]" />
      <FloatingIcon icon={Syringe} className="top-[40%] left-[5%]" />
      <FloatingIcon icon={Pill} className="bottom-[30%] left-[7%]" />
      <FloatingIcon icon={Link2} className="top-[45%] right-[5%]" />
      <FloatingIcon icon={Star} className="bottom-[20%] right-[8%]" />
      <FloatingIcon icon={Heart} className="bottom-[15%] right-[15%]" />
      <FloatingIcon icon={Stethoscope} className="bottom-[25%] left-[12%]" />

      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/30 backdrop-blur-sm text-primary-foreground hover:bg-card/40 transition-colors text-sm font-medium border border-card/40"
        >
          <Globe className="w-4 h-4" />
          {t.langLabel}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-8">
        {/* Logo & Hospital Name */}
        <div className="text-center mb-6 group brand-logo-link">
          <img
            src={loginLogo}
            alt={loginLogoAlt}
            className="brand-logo brand-logo-login mx-auto mb-3"
          />
          <h1 className="text-2xl font-heading font-bold text-primary-foreground drop-shadow-md">
            {loginTitle}
          </h1>
          <p className="text-primary-foreground/90 text-base font-medium drop-shadow-sm">
            {loginTitleAr}
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md bg-card/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-card/70 animate-slide-up">
          {/* Lock Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-elegant">
              <Lock className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>

          <h2 className="text-center text-xl font-heading font-bold text-primary mb-1">
            {t.title}
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-6">
            {t.subtitle}
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-foreground text-sm font-semibold">
                {t.email}
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-primary-ice/80 border-primary/20 rounded-xl h-12 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-foreground text-sm font-semibold">
                {t.password}
              </Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-primary-ice/80 border-primary/20 rounded-xl h-12 text-sm pr-10 text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary"
              />
              <label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer">
                {t.remember}
              </label>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl h-12 text-base font-semibold gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> {t.signingIn}
                </span>
              ) : (
                t.signIn
              )}
            </Button>
          </form>

          {/* Notice */}
          <div className="mt-5 flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Shield className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.notice}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-4">
        <p className="text-primary-foreground/80 text-sm drop-shadow-sm">
          {t.powered}
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
