import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatBookmarks, useDeleteBookmark } from "@/hooks/useChatBookmarks";
import { useChatConversations } from "@/hooks/useChatConversations";
import { Bookmark, Search, Trash2, MessageSquare, Bot, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const AdminBookmarks = () => {
  const { data: bookmarks, isLoading } = useChatBookmarks();
  const { data: conversations } = useChatConversations();
  const deleteBookmark = useDeleteBookmark();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const filtered = useMemo(
    () =>
      bookmarks?.filter((b) => b.content.toLowerCase().includes(search.toLowerCase())) ?? [],
    [bookmarks, search],
  );

  const getConversationTitle = (convId: string) =>
    conversations?.find((c) => c.id === convId)?.title ?? "Unknown Chat";

  const isLongContent = (content: string) =>
    content.length > 420 || content.includes("\n|") || content.includes("```") || content.includes("\n\n");

  const shouldUseInternalScroll = (content: string) => content.length > 1400;

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
      <div className="mx-auto w-full max-w-5xl px-3 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bookmark className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                Saved Bookmarks
              </h1>
              <p className="text-sm text-muted-foreground">
                {filtered.length} bookmarked messages
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="sticky top-0 z-10 border-b border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
            <div className="p-4 sm:p-6 pb-3">
              <h2 className="text-base font-heading font-bold text-foreground">Your Bookmarks</h2>
              <p className="text-sm text-muted-foreground">
                Messages you've saved from chat conversations
              </p>
            </div>
            <div className="px-4 sm:px-6 pb-4">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookmarks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 border-border/60"
                />
              </div>
            </div>
          </div>

          <ScrollArea className="max-h-[calc(100vh-18rem)] sm:max-h-[calc(100vh-15rem)]">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !filtered.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bookmark className="w-8 h-8 text-primary/60" />
                </div>
                <p className="text-base font-medium text-muted-foreground">No bookmarks yet</p>
                <p className="text-sm text-muted-foreground">
                  Bookmark messages in the chat to save them here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filtered.map((bm) => (
                  <article
                    key={bm.id}
                    className="group p-4 sm:p-6 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        bm.role === "assistant" ? "bg-primary/10" : "bg-secondary"
                      )}>
                        {bm.role === "assistant" ? (
                          <Bot className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-xs font-medium text-muted-foreground capitalize">
                            {bm.role}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">•</span>
                           <button
                            onClick={() => navigate(`/admin/chat?conversation=${bm.conversation_id}`)}
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            {getConversationTitle(bm.conversation_id)}
                          </button>
                          <span className="text-[10px] text-muted-foreground/70">•</span>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(bm.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="relative rounded-lg border border-border/50 bg-background/60 p-3 sm:p-4">
                          <div
                            className={cn(
                              "text-sm text-foreground leading-relaxed",
                              !expandedItems[bm.id] && isLongContent(bm.content) && "max-h-44 overflow-hidden",
                              expandedItems[bm.id] && shouldUseInternalScroll(bm.content) && "max-h-[45vh] overflow-auto pr-1",
                            )}
                          >
                            {bm.role === "assistant" ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ children }) => <h1 className="text-base sm:text-lg font-bold mt-3 mb-2 first:mt-0">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-sm sm:text-base font-bold mt-3 mb-2 first:mt-0">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h3>,
                                  p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
                                  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-0.5">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-0.5">{children}</ol>,
                                  li: ({ children }) => <li className="break-words">{children}</li>,
                                  table: ({ children }) => (
                                    <div className="overflow-x-auto my-2 pb-1">
                                      <table className="min-w-[36rem] sm:min-w-full text-xs border-collapse border border-border/60 rounded-md overflow-hidden">
                                        {children}
                                      </table>
                                    </div>
                                  ),
                                  thead: ({ children }) => <thead className="bg-secondary/60">{children}</thead>,
                                  th: ({ children }) => <th className="px-3 py-1.5 text-left font-semibold border border-border/60 whitespace-nowrap">{children}</th>,
                                  td: ({ children }) => <td className="px-3 py-1.5 border border-border/60 align-top">{children}</td>,
                                  tr: ({ children }) => <tr className="even:bg-secondary/30">{children}</tr>,
                                  code: ({ className, children }) => {
                                    const isBlock = className?.includes("language-");
                                    return isBlock ? (
                                      <pre className="bg-secondary/70 rounded-md p-2 my-2 overflow-x-auto text-xs">
                                        <code className={className}>{children}</code>
                                      </pre>
                                    ) : (
                                      <code className="bg-secondary/70 rounded px-1 py-0.5 text-xs break-all">{children}</code>
                                    );
                                  },
                                  blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 italic my-2 text-muted-foreground">{children}</blockquote>,
                                  hr: () => <hr className="my-3 border-border/40" />,
                                  a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 break-all">{children}</a>,
                                }}
                              >
                                {bm.content}
                              </ReactMarkdown>
                            ) : (
                              <p className="break-words whitespace-pre-wrap">{bm.content}</p>
                            )}
                          </div>

                          {!expandedItems[bm.id] && isLongContent(bm.content) && (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background/95 to-transparent" />
                          )}
                        </div>

                        {isLongContent(bm.content) && (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(bm.id)}
                            className="text-xs text-primary hover:underline"
                          >
                            {expandedItems[bm.id] ? "Collapse" : "Expand full content"}
                          </button>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                        onClick={() => deleteBookmark.mutate(bm.id)}
                        aria-label="Remove bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
  );
};

export default AdminBookmarks;
