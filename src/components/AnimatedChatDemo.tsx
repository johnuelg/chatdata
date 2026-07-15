import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, Stethoscope, User } from "lucide-react";

type MetricTone = "default" | "sky" | "green";

interface AssistantRow {
  label: string;
  value: string;
  tone?: MetricTone;
}

interface AssistantRowProgress extends AssistantRow {
  typedValue: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string | { rows: AssistantRowProgress[]; insight: string };
}

const USER_PROMPT = "Review the current KPI performance for Emergency Department (ED) for April 2025";
const INSIGHT_TEXT =
  "💡 Key Findings: ED efficiency is 12% above target. Door-to-doctor times show excellent triage performance. Consider minor workflow adjustments for disposition delays.";

const RESPONSE_ROWS: AssistantRow[] = [
  { label: "Patient Visits", value: "7,450" },
  { label: "Door to Doctor", value: "5 min", tone: "sky" },
  { label: "Doctor to Decision", value: "6 min", tone: "sky" },
  { label: "Decision to Disposition", value: "0:45 min", tone: "green" },
  { label: "Urgent", value: "51%" },
  { label: "Non-Urgent", value: "49%" },
  { label: "Door to Layout", value: "99%", tone: "sky" },
  { label: "DAMA", value: "35 (0.5%)" },
  { label: "Mortality Rate", value: "0.03% (2 patients)" },
];

const AnimatedChatDemo = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTypingInput, setIsTypingInput] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const valueColorByTone = useMemo(
    () => ({
      default: "hsl(var(--foreground))",
      sky: "hsl(var(--primary))",
      green: "hsl(var(--emerald))",
    }),
    []
  );

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isAssistantTyping, inputText]);

  useEffect(() => {
    let cancelled = false;

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const typeInputPrompt = async (text: string) => {
      setIsTypingInput(true);
      for (let i = 0; i <= text.length; i += 1) {
        if (cancelled) return;
        setInputText(text.slice(0, i));
        await delay(60 + Math.random() * 40);
      }
      setIsTypingInput(false);
      setShowSend(true);
    };

    const showAssistantResponseInstantly = async () => {
      setIsAssistantTyping(true);
      await delay(1100 + Math.random() * 500);
      if (cancelled) return;
      setIsAssistantTyping(false);

      const assistantId = `assistant-${Date.now()}`;
      const fullRows = RESPONSE_ROWS.map((row) => ({ ...row, typedValue: row.value }));

      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: { rows: fullRows, insight: INSIGHT_TEXT },
        },
      ]);
    };

    const runDemoLoop = async () => {
      setMessages([]);
      setInputText("");
      setIsTypingInput(false);
      setIsAssistantTyping(false);
      setShowSend(false);

      await delay(260);
      if (cancelled) return;

      await typeInputPrompt(USER_PROMPT);
      await delay(900 + Math.random() * 500);
      if (cancelled) return;

      setInputText("");
      setShowSend(false);

      const userMessageId = `user-${Date.now()}`;
      setMessages([{ id: userMessageId, role: "user", content: USER_PROMPT }]);

      await delay(900);
      if (cancelled) return;

      await showAssistantResponseInstantly();
      if (cancelled) return;

      await delay(6000);
      if (cancelled) return;
      runDemoLoop();
    };

    runDemoLoop();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[48rem] xl:max-w-[50rem] text-left px-2 sm:px-3 md:px-0">
      <div className="overflow-hidden rounded-[22px] sm:rounded-[26px] md:rounded-[30px] border border-primary/20 bg-card/80 shadow-[0_14px_40px_hsl(var(--primary)/0.18)] backdrop-blur-md">
        <div className="bg-gradient-to-r from-muted/45 via-muted/20 to-muted/45 border-b border-border/60 px-3.5 sm:px-5 py-3 sm:py-3.5 flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-coral/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald/80" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground/95 flex-1 text-center tracking-wide">AI Data Assistant</span>
          <Stethoscope className="w-4 h-4 text-primary" />
        </div>

        <div ref={chatRef} className="min-h-[clamp(15rem,35vh,19rem)] max-h-[clamp(18.5rem,45vh,24rem)] overflow-y-auto p-3.5 sm:p-4 md:p-6 space-y-3.5 sm:space-y-4">
          {messages.map((message, idx) => (
            <div
              key={`${message.role}-${idx}`}
              className={`flex items-start gap-3 animate-[chat-bubble-in_0.42s_cubic-bezier(0.22,1,0.36,1)] ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-9 h-9 rounded-full border border-border/60 bg-secondary/60 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-primary/90" />
                </div>
              )}
              <div
                className={`max-w-[90%] sm:max-w-[86%] rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-primary/85 text-primary-foreground rounded-tr-md shadow-[0_8px_22px_hsl(var(--primary)/0.28)]"
                    : "bg-secondary/55 text-foreground rounded-tl-md"
                }`}
              >
                {typeof message.content === "string" ? (
                  <p>{message.content}</p>
                ) : (
                  <div className="space-y-2.5">
                    {message.content.rows.map((row, idx) => (
                      <div key={`${row.label}-${idx}`} className="flex flex-wrap items-center gap-2 animate-[fade-in_0.28s_ease-out]">
                        <span className="text-muted-foreground">{row.label}:</span>
                        <span
                          className={`${row.tone === "sky" || row.tone === "green" ? "font-bold" : "font-semibold"}`}
                          style={{ color: valueColorByTone[row.tone ?? "default"] }}
                        >
                          {row.typedValue}
                          {row.typedValue.length > 0 && row.typedValue.length < row.value.length ? (
                            <span className="inline-block align-middle w-0.5 h-3.5 ml-1 bg-primary/80 animate-blink" />
                          ) : null}
                        </span>
                      </div>
                    ))}
                    {message.content.rows.length > 0 && (
                      <div className="pt-3 mt-3 border-t border-border/60 animate-[fade-in_0.35s_ease-out]">
                        <p className="text-sm sm:text-[0.97rem] text-muted-foreground/95 leading-relaxed italic">
                          {message.content.insight}
                          {message.content.insight.length > 0 && message.content.insight.length < INSIGHT_TEXT.length ? (
                            <span className="inline-block align-middle w-0.5 h-3.5 ml-1 bg-primary/80 animate-blink" />
                          ) : null}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-9 h-9 rounded-full border border-primary/25 bg-primary/15 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}

          {isAssistantTyping && (
            <div className="flex items-start gap-3 animate-[chat-bubble-in_0.42s_cubic-bezier(0.22,1,0.36,1)]">
              <div className="w-9 h-9 rounded-full border border-border/60 bg-secondary/60 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary/90" />
              </div>
              <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-secondary/55 border border-border/60">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span>typing...</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[typing-dot_1.4s_ease-in-out_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[typing-dot_1.4s_ease-in-out_0.2s_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[typing-dot_1.4s_ease-in-out_0.4s_infinite]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1">
          <div className={`flex items-center gap-2.5 sm:gap-3 rounded-2xl border px-3.5 sm:px-4 py-3 sm:py-3.5 transition-all duration-300 ${isTypingInput ? "border-primary/60 ring-1 ring-primary/30" : "border-border/60"} bg-secondary/35`}>
            <div className="flex-1 min-h-[20px] text-[13px] sm:text-sm text-foreground text-left">
              {inputText ? (
                <span>
                  {inputText}
                  {isTypingInput && <span className="inline-block align-middle w-0.5 h-4 ml-1 bg-primary animate-blink" />}
                </span>
              ) : (
                <span className="text-muted-foreground">Ask about your healthcare data...</span>
              )}
            </div>
            <div
              className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                showSend ? "bg-primary scale-105 shadow-[0_0_0_4px_hsl(var(--primary)/0.18)]" : "bg-primary/60 scale-100"
              }`}
            >
              <Send
                className={`absolute w-4 h-4 text-primary-foreground transition-all duration-300 ${
                  showSend ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                }`}
              />
              <Stethoscope
                className={`absolute w-4 h-4 text-primary-foreground transition-all duration-300 ${
                  showSend ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -top-5 -right-3 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-3 -left-3 sm:-left-6 w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
    </div>
  );
};

export default AnimatedChatDemo;