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
        await delay(50 + Math.random() * 50);
      }
      setIsTypingInput(false);
      setShowSend(true);
    };

    const typeAssistantResponse = async (assistantId: string) => {
      const initRows = RESPONSE_ROWS.map((row) => ({ ...row, typedValue: "" }));
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: { rows: initRows, insight: "" },
              }
            : msg
        )
      );

      for (let rowIdx = 0; rowIdx < RESPONSE_ROWS.length; rowIdx += 1) {
        const currentRow = RESPONSE_ROWS[rowIdx];
        for (let i = 0; i <= currentRow.value.length; i += 1) {
          if (cancelled) return;
          const nextValue = currentRow.value.slice(0, i);
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== assistantId || typeof msg.content === "string") return msg;
              const rows = msg.content.rows.map((row, index) =>
                index === rowIdx ? { ...row, typedValue: nextValue } : row
              );
              return { ...msg, content: { ...msg.content, rows } };
            })
          );
          await delay(36 + Math.random() * 44);
        }
        await delay(130 + Math.random() * 90);
      }

      for (let i = 0; i <= INSIGHT_TEXT.length; i += 1) {
        if (cancelled) return;
        const nextInsight = INSIGHT_TEXT.slice(0, i);
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== assistantId || typeof msg.content === "string") return msg;
            return { ...msg, content: { ...msg.content, insight: nextInsight } };
          })
        );
        await delay(26 + Math.random() * 32);
      }
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

      setIsAssistantTyping(true);
      await delay(1200 + Math.random() * 700);
      if (cancelled) return;
      setIsAssistantTyping(false);

      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: { rows: [], insight: "" } }]);

      await typeAssistantResponse(assistantId);
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
    <div className="relative mx-auto max-w-2xl">
      <div className="rounded-[30px] border border-primary/20 bg-card/80 shadow-[0_14px_40px_hsl(var(--primary)/0.18)] overflow-hidden backdrop-blur-md">
        <div className="bg-gradient-to-r from-muted/45 via-muted/20 to-muted/45 border-b border-border/60 px-5 py-3.5 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-coral/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald/80" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground/95 flex-1 text-center tracking-wide">AI Data Assistant</span>
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
                <span className="text-muted-foreground">Ask about your healthcare data...</span>
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