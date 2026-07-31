"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function NotificationBell() {
  const user = useAppStore((s) => s.user);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  const emailParam = user?.email
    ? `email=${encodeURIComponent(user.email)}`
    : "";

  const load = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/notifications?${emailParam}`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) return;

      const list: NotificationItem[] = data.notifications || [];
      setItems(list);
      setUnread(data.unread || 0);

      if (!primed.current) {
        list.forEach((n) => seenIds.current.add(n.id));
        primed.current = true;
        return;
      }

      const fresh = list.find((n) => !n.read && !seenIds.current.has(n.id));
      list.forEach((n) => seenIds.current.add(n.id));
      if (fresh) {
        setToast(fresh);
      }
    } catch {
      /* ignore poll errors */
    }
  }, [user?.email, emailParam]);

  useEffect(() => {
    primed.current = false;
    seenIds.current = new Set();
    void load();
    const id = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 8_000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function markRead(id?: string, markAll = false) {
    if (!user?.email) return;
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: user.email,
          id,
          markAll,
        }),
      });
      await load();
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="relative rounded-md p-2 text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
          >
            <Bell className="h-4 w-4" />
            {unread > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))]">
          <DropdownMenuLabel className="flex items-center justify-between gap-2 font-normal">
            <span className="text-sm font-medium text-foreground">Notifications</span>
            {unread > 0 ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                onClick={() => void markRead(undefined, true)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                Mark all read
              </button>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted">
              No notifications yet.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {items.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  asChild
                  className={cn(
                    "cursor-pointer items-start gap-2 py-2.5",
                    !n.read && "bg-primary/5"
                  )}
                  onSelect={() => {
                    void markRead(n.id);
                  }}
                >
                  <Link href={n.link || "/requests"} className="flex w-full flex-col gap-0.5">
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {n.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {n.message}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {toast ? (
        <div
          className="fixed bottom-4 right-4 z-[60] w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 shadow-lg"
          role="status"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{toast.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">{toast.message}</p>
              <Link
                href={toast.link || "/requests"}
                className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                onClick={() => {
                  void markRead(toast.id);
                  setToast(null);
                }}
              >
                View request
              </Link>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              aria-label="Dismiss"
              onClick={() => setToast(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
