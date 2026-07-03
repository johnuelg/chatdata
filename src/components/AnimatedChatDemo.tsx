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
      ? "راجع أداء مؤشرات الأداء الرئيسية لقسم الطوارئ لشهر أبريل 2025"
      : "Review the current KPI performance for Emergency Department (ED) for April 2025";

  const insightText =
    lang === "ar"
      ? "النتيجة: كفاءة القسم أعلى من الهدف بنسبة 12% مع فرص تحسين طفيفة في زمن إنهاء الإجراءات."
      : "Key finding: ED efficiency is 12% above target, with minor optimization opportunities in disposition workflow.";

  const responseRows =
    lang === "ar"
      ? [
          ["زيارات المرضى", "7,450"],
          ["من الدخول للطبيب", "5 دقائق"],
          ["من الطبيب للقرار", "6 دقائق"],
          ["من القرار للتصرف", "45 دقيقة"],
        ]
      : [
          ["Patient Visits", "7,450"],
          ["Door to Doctor", "5 min"],
          ["Doctor to Decision", "6 min"],
          ["Decision to Disposition", "45 min"],
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
        await delay(52 + Math.random() * 36);
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

      await delay(1200);
      if (cancelled) return;

      await typeMessage(userMessage);
      await delay(700);
      if (cancelled) return;

      setInputText("");
      setShowSend(false);
      setMessages([{ role: "user", content: userMessage }]);

      await delay(900);
      if (cancelled) return;

      setIsAssistantTyping(true);
      await delay(1800);
      if (cancelled) return;
      setIsAssistantTyping(false);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: (
            <div className="space-y-2">
              {responseRows.map(([label, value], idx) => (
                <div
                  key={`${label}-${idx}`}
                  className="flex items-center gap-2 opacity-0 animate-[fade-in_0.25s_ease-out_forwards]"
                  style={{ animationDelay: `${idx * 120}ms` }}
                >
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
              ))}
              <div
                className="pt-3 mt-3 border-t border-border/60 opacity-0 animate-[fade-in_0.25s_ease-out_forwards]"
                style={{ animationDelay: "700ms" }}
              >
                <p className="text-sm text-muted-foreground leading-relaxed">{insightText}</p>
              </div>
            </div>
          ),
        },
      ]);

      await delay(7600);
      if (!cancelled) run();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [insightText, userMessage, lang]);

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="rounded-2xl border border-border/60 bg-card/95 shadow-[0_10px_34px_hsl(var(--primary)/0.13)] overflow-hidden backdrop-blur-sm">
        <div className="bg-muted/35 border-b border-border/60 px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-coral/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald/80" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground flex-1 text-center">
            {lang === "ar" ? "مساعد البيانات الذكي" : "AI Data Assistant"}
          </span>
          <Stethoscope className="w-4 h-4 text-primary" />
        </div>

        <div ref={chatRef} className="min-h-[300px] max-h-[360px] overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((message, idx) => (
            <div
              key={`${message.role}-${idx}`}
              className={`flex items-start gap-3 animate-fade-in ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-md"
                    : "bg-secondary/70 text-foreground rounded-tl-md"
                }`}
              >
                {typeof message.content === "string" ? <p>{message.content}</p> : message.content}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}

          {isAssistantTyping && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-secondary/70">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span>{lang === "ar" ? "يكتب" : "Typing"}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[typing-dot_1.2s_ease-in-out_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[typing-dot_1.2s_ease-in-out_0.15s_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[typing-dot_1.2s_ease-in-out_0.3s_infinite]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${isTypingInput ? "border-primary/50 ring-1 ring-primary/20" : "border-border/60"} bg-secondary/35`}>
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
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${showSend ? "bg-primary scale-105" : "bg-primary/55"}`}>
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