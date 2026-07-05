import { useEffect, useRef, useState } from "react";
import { Bot, Send, Stethoscope, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatMessage {
  role: "user" | "assistant";
  content: string | React.ReactNode;
}

const AnimatedChatDemo = () => {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTypingInput, setIsTypingInput] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const userMessage =
    lang === "ar"
      ? "راجع أداء مؤشرات الأداء الرئيسية لقسم الطوارئ لشهر أبريل 2026"
      : "Review the current KPI performance for Emergency Department (ED) for April 2026";

  const insightText =
    lang === "ar"
      ? "💡 النتائج الرئيسية: كفاءة قسم الطوارئ أعلى من الهدف بنسبة 12%. زمن من الباب إلى الطبيب يُظهر أداء فرز ممتازًا. يُنصح ببعض التعديلات الطفيفة في سير عمل إنهاء الإجراءات."
      : "💡 Key Findings: ED efficiency is 12% above target. Door-to-doctor times show excellent triage performance. Consider minor workflow adjustments for disposition delays.";

  const responseRows: Array<{ label: string; value: string; valueClass?: string }> =
    lang === "ar"
      ? [
          { label: "زيارات المرضى", value: "7,450" },
          { label: "من الدخول للطبيب", value: "5 دقائق", valueClass: "text-primary font-bold" },
          { label: "من الطبيب للقرار", value: "6 دقائق", valueClass: "text-primary font-bold" },
          { label: "من القرار للتصرف", value: "0:45 دقيقة", valueClass: "text-primary font-bold" },
          { label: "حالات عاجلة", value: "51%" },
          { label: "حالات غير عاجلة", value: "49%" },
          { label: "من الباب إلى إنهاء الخدمة", value: "99%", valueClass: "text-primary font-bold" },
          { label: "خروج ضد النصيحة الطبية", value: "35 (0.5%)" },
          { label: "معدل الوفيات", value: "0.03% (2 مرضى)" },
        ]
      : [
          { label: "Patient Visits", value: "7,450" },
          { label: "Door to Doctor", value: "5 min", valueClass: "text-primary font-bold" },
          { label: "Doctor to Decision", value: "6 min", valueClass: "text-primary font-bold" },
          { label: "Decision to Disposition", value: "0:45 min", valueClass: "text-primary font-bold" },
          { label: "Urgent", value: "51%" },
          { label: "Non-Urgent", value: "49%" },
          { label: "Door to Disposition", value: "99%", valueClass: "text-primary font-bold" },
          { label: "DAMA", value: "35 (0.5%)" },
          { label: "Mortality Rate", value: "0.03% (2 patients)" },
        ];

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isAssistantTyping]);

  useEffect(() => {
    let cancelled = false;

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const typeMessage = async (text: string) => {
      setIsTypingInput(true);
      for (let i = 0; i <= text.length; i += 1) {
        if (cancelled) return;
        setInputText(text.slice(0, i));
        await delay(60 + Math.random() * 40);
      }
      setIsTypingInput(false);
      setShowSend(true);
    };

    const run = async () => {
      setMessages([]);
      setInputText("");
      setIsTypingInput(false);
      setIsAssistantTyping(false);
      setShowSend(false);

      await delay(220);
      if (cancelled) return;

      await typeMessage(userMessage);
      await delay(500);
      if (cancelled) return;

      setInputText("");
      setShowSend(false);
      setMessages([{ role: "user", content: userMessage }]);

      await delay(720);
      if (cancelled) return;

      setIsAssistantTyping(true);
      await delay(2350);
      if (cancelled) return;
      setIsAssistantTyping(false);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: (
            <div className="space-y-2">
              {responseRows.map(({ label, value, valueClass }, idx) => (
                <div
                  key={`${label}-${idx}`}
                  className="flex items-center gap-2 opacity-0 animate-[fade-in_0.36s_ease-out_forwards]"
                  style={{ animationDelay: `${idx * 160}ms` }}
                >
                  <span className="text-muted-foreground">{label}:</span>
                  <span className={valueClass ?? "font-semibold text-foreground"}>{value}</span>
                </div>
              ))}
              <div
                className="pt-4 mt-3 border-t border-border/60 opacity-0 animate-[fade-in_0.4s_ease-out_forwards]"
                style={{ animationDelay: "1320ms" }}
              >
                <p className="text-[1.05rem] text-muted-foreground/95 leading-relaxed italic text-center">{insightText}</p>
              </div>
            </div>
          ),
        },
      ]);

      await delay(8000);
      if (!cancelled) run();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [insightText, userMessage, lang]);

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="rounded-[30px] border border-primary/20 bg-card/80 shadow-[0_14px_40px_hsl(var(--primary)/0.18)] overflow-hidden backdrop-blur-md">
        <div className="bg-gradient-to-r from-muted/45 via-muted/20 to-muted/45 border-b border-border/60 px-5 py-3.5 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-coral/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald/80" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground/95 flex-1 text-center tracking-wide">
            {lang === "ar" ? "مساعد البيانات الذكي" : "AI Data Assistant"}
          </span>
          <Stethoscope className="w-4 h-4 text-primary" />
        </div>

        <div ref={chatRef} className="min-h-[300px] max-h-[365px] overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((message, idx) => (
            <div
              key={`${message.role}-${idx}`}
              className={`flex items-start gap-3 animate-[fade-in_0.35s_ease-out] ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-9 h-9 rounded-full border border-border/60 bg-secondary/60 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-primary/90" />
                </div>
              )}
              <div
                className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-primary/85 text-primary-foreground rounded-tr-md shadow-[0_8px_22px_hsl(var(--primary)/0.28)]"
                    : "bg-secondary/55 text-foreground rounded-tl-md"
                }`}
              >
                {typeof message.content === "string" ? <p>{message.content}</p> : message.content}
              </div>
              {message.role === "user" && (
                <div className="w-9 h-9 rounded-full border border-primary/25 bg-primary/15 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}

          {isAssistantTyping && (
            <div className="flex items-start gap-3 animate-[fade-in_0.35s_ease-out]">
              <div className="w-9 h-9 rounded-full border border-border/60 bg-secondary/60 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary/90" />
              </div>
              <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-secondary/55 border border-border/60">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span>{lang === "ar" ? "يكتب" : "typing"}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[typing-dot_1.4s_ease-in-out_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[typing-dot_1.4s_ease-in-out_0.2s_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[typing-dot_1.4s_ease-in-out_0.4s_infinite]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-4 pt-1">
          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-300 ${isTypingInput ? "border-primary/60 ring-1 ring-primary/30" : "border-border/60"} bg-secondary/35`}>
            <div className="flex-1 min-h-[20px] text-sm text-foreground">
              {inputText ? (
                <span>
                  {inputText}
                  {isTypingInput && <span className="inline-block align-middle w-0.5 h-4 ml-1 bg-primary animate-blink" />}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {lang === "ar" ? "اسأل عن بيانات الرعاية الصحية..." : "Ask about your healthcare data..."}
                </span>
              )}
            </div>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${showSend ? "bg-primary scale-105" : "bg-primary/60"}`}>
              {showSend ? <Send className="w-4 h-4 text-primary-foreground" /> : <Stethoscope className="w-4 h-4 text-primary-foreground" />}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -top-6 -right-4 w-24 h-24 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-4 -left-6 w-24 h-24 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
    </div>
  );
};

export default AnimatedChatDemo;