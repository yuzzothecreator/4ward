"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MessageSquarePlus,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

type Peer = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
};

type Thread = {
  peer: Peer;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
  projectTitle: string | null;
};

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  mine: boolean;
  project?: { id: string; title: string; slug: string } | null;
};

const QUICK_REPLIES = [
  "Thanks!",
  "Is this still available?",
  "Can you share more details?",
  "I’ll purchase now.",
];

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 py-16 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
        </div>
      }
    >
      <MessagesPageInner />
    </Suspense>
  );
}

function MessagesPageInner() {
  const user = useAppStore((s) => s.user);
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [activePeerId, setActivePeerId] = useState<string | null>(null);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [threadQuery, setThreadQuery] = useState("");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [people, setPeople] = useState<Peer[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const deepLinkHandled = useRef(false);

  const emailParam = user?.email
    ? `email=${encodeURIComponent(user.email)}`
    : "";

  const loadThreads = useCallback(async () => {
    if (!user?.email) {
      setLoadingThreads(false);
      return;
    }
    try {
      const res = await fetch(`/api/messages?${emailParam}`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load conversations");
        return;
      }
      setThreads(data.threads || []);
      setUnreadTotal(data.unreadTotal || 0);
      setError("");
    } catch {
      setError("Network error loading messages");
    } finally {
      setLoadingThreads(false);
    }
  }, [user?.email, emailParam]);

  const loadChat = useCallback(
    async (peerId: string) => {
      if (!user?.email) return;
      setLoadingChat(true);
      try {
        const res = await fetch(
          `/api/messages?peerId=${encodeURIComponent(peerId)}&${emailParam}`,
          { credentials: "same-origin" }
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not open chat");
          return;
        }
        setPeer(data.peer);
        setMessages(data.messages || []);
        setThreads((prev) => {
          let cleared = 0;
          const next = prev.map((t) => {
            if (t.peer.id !== peerId || t.unreadCount === 0) return t;
            cleared = t.unreadCount;
            return { ...t, unreadCount: 0 };
          });
          if (cleared > 0) {
            setUnreadTotal((n) => Math.max(0, n - cleared));
          }
          return next;
        });
      } catch {
        setError("Network error opening chat");
      } finally {
        setLoadingChat(false);
      }
    },
    [user?.email, emailParam]
  );

  useEffect(() => {
    void loadThreads();
    const id = window.setInterval(() => void loadThreads(), 20_000);
    return () => window.clearInterval(id);
  }, [loadThreads]);

  useEffect(() => {
    if (deepLinkHandled.current || !user?.email) return;
    const peerParam = searchParams.get("peer");
    const projectParam = searchParams.get("project");
    if (!peerParam) return;
    deepLinkHandled.current = true;
    if (projectParam) setProjectId(projectParam);
    setActivePeerId(peerParam);
    setMobileShowChat(true);
  }, [searchParams, user?.email]);

  useEffect(() => {
    if (!activePeerId) return;
    void loadChat(activePeerId);
    const id = window.setInterval(() => void loadChat(activePeerId), 12_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh by peer id
  }, [activePeerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activePeerId]);

  useEffect(() => {
    if (peopleQuery.trim().length < 2) {
      setPeople([]);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/messages?q=${encodeURIComponent(peopleQuery.trim())}&${emailParam}`,
          { credentials: "same-origin" }
        );
        const data = await res.json();
        if (res.ok) setPeople(data.people || []);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [peopleQuery, emailParam]);

  const filteredThreads = useMemo(() => {
    const q = threadQuery.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.peer.name.toLowerCase().includes(q) ||
        t.peer.username.toLowerCase().includes(q) ||
        t.lastMessage.toLowerCase().includes(q)
    );
  }, [threads, threadQuery]);

  async function selectPeer(peerId: string) {
    setActivePeerId(peerId);
    setMobileShowChat(true);
    setComposeOpen(false);
    setPeopleQuery("");
    setPeople([]);
  }

  async function send(content?: string) {
    const body = (content ?? text).trim();
    if (!body || !activePeerId || !user?.email || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: user.email,
          receiverId: activePeerId,
          content: body,
          projectId: projectId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Send failed");
        return;
      }
      setText("");
      setProjectId(null);
      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          content: data.message.content,
          createdAt: data.message.createdAt,
          read: true,
          mine: true,
        },
      ]);
      await loadThreads();
    } catch {
      setError("Network error sending message");
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg space-y-3 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-sm text-muted">Sign in to chat with buyers and sellers.</p>
        <Link href="/sign-in?next=/dashboard/messages">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-muted">
            Chat with buyers, sellers, and support — simple and fast.
            {unreadTotal > 0 ? (
              <span className="ml-2 text-primary">
                {unreadTotal} unread
              </span>
            ) : null}
          </p>
        </div>
        <Button
          size="sm"
          variant={composeOpen ? "secondary" : "default"}
          onClick={() => {
            setComposeOpen((v) => !v);
            setMobileShowChat(false);
          }}
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {composeOpen && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Start a conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, @username, or email…"
                value={peopleQuery}
                onChange={(e) => setPeopleQuery(e.target.value)}
                autoFocus
              />
            </div>
            {peopleQuery.trim().length < 2 ? (
              <p className="text-xs text-muted">
                Type at least 2 characters to find someone.
              </p>
            ) : people.length === 0 ? (
              <p className="text-sm text-muted">No users found.</p>
            ) : (
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {people.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPeer(p.id)}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-foreground/5"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback>{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted">
                        @{p.username} · {p.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:h-[min(70vh,640px)] lg:grid-cols-3">
        <Card
          className={cn(
            "overflow-hidden lg:col-span-1",
            mobileShowChat ? "hidden lg:flex lg:flex-col" : "flex flex-col"
          )}
        >
          <CardHeader className="space-y-3 border-b border-border pb-3">
            <CardTitle className="text-base">Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-8 text-sm"
                placeholder="Filter chats…"
                value={threadQuery}
                onChange={(e) => setThreadQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-1 overflow-y-auto p-2">
            {loadingThreads ? (
              <p className="flex items-center gap-2 p-3 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </p>
            ) : filteredThreads.length === 0 ? (
              <div className="space-y-2 p-4 text-center">
                <UserRound className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted">No conversations yet.</p>
                <p className="text-xs text-muted-foreground">
                  Tap <strong>New chat</strong> to message a seller or buyer.
                </p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const active = activePeerId === t.peer.id;
                return (
                  <button
                    key={t.peer.id}
                    type="button"
                    onClick={() => selectPeer(t.peer.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-3 text-left transition",
                      active ? "bg-primary/20" : "hover:bg-foreground/5"
                    )}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={t.peer.avatar} />
                      <AvatarFallback>{t.peer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {t.peer.name}
                        </p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatTime(t.lastAt)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.lastMessage}
                      </p>
                      {t.projectTitle ? (
                        <p className="truncate text-[10px] text-primary">
                          Re: {t.projectTitle}
                        </p>
                      ) : null}
                    </div>
                    {t.unreadCount > 0 ? (
                      <Badge variant="neon" className="shrink-0">
                        {t.unreadCount}
                      </Badge>
                    ) : null}
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card
          className={cn(
            "flex min-h-[420px] flex-col lg:col-span-2 lg:min-h-0",
            mobileShowChat ? "flex" : "hidden lg:flex"
          )}
        >
          {!activePeerId || !peer ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <MessageSquarePlus className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Pick a conversation
              </p>
              <p className="max-w-sm text-xs text-muted">
                Select someone on the left, or start a new chat to ask about a
                project, license, or delivery.
              </p>
            </div>
          ) : (
            <>
              <CardHeader className="flex flex-row items-center gap-2 border-b border-border py-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileShowChat(false)}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={peer.avatar} />
                  <AvatarFallback>{peer.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-base">{peer.name}</CardTitle>
                  <p className="truncate text-xs text-muted">@{peer.username}</p>
                </div>
                <Link href={`/${peer.username}`}>
                  <Button size="sm" variant="outline">
                    Profile
                  </Button>
                </Link>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                {loadingChat && messages.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading chat…
                  </p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-muted">
                    Say hello — this is the start of your chat with {peer.name}.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[85%] space-y-1 sm:max-w-[75%]",
                        m.mine ? "ml-auto" : "mr-auto"
                      )}
                    >
                      {m.project ? (
                        <Link
                          href={`/projects/${m.project.slug}`}
                          className="block text-[10px] text-primary hover:underline"
                        >
                          About: {m.project.title}
                        </Link>
                      ) : null}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2 text-sm",
                          m.mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-foreground/10 text-foreground"
                        )}
                      >
                        {m.content}
                      </div>
                      <p
                        className={cn(
                          "px-1 text-[10px] text-muted-foreground",
                          m.mine ? "text-right" : "text-left"
                        )}
                      >
                        {formatTime(m.createdAt)}
                        {m.mine ? (m.read ? " · Read" : " · Sent") : ""}
                      </p>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </CardContent>

              <div className="space-y-2 border-t border-border p-3 sm:p-4">
                {projectId ? (
                  <p className="rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary">
                    First message will reference this project.{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setProjectId(null)}
                    >
                      Clear
                    </button>
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-1">
                  {QUICK_REPLIES.map((q) => (
                    <Button
                      key={q}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={sending}
                      onClick={() => void send(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Message ${peer.name}…`}
                    rows={2}
                    maxLength={2000}
                    className="min-w-0 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                  />
                  <Button
                    onClick={() => void send()}
                    className="shrink-0 self-end"
                    disabled={sending || !text.trim()}
                    aria-label="Send"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Enter to send · Shift+Enter for new line · {text.length}/2000
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
