"use client";

import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const threads = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    preview: "Does CampusConnect include Socket.io setup?",
    messages: [
      { from: "them", text: "Hi! Interested in CampusConnect. Does it include Socket.io setup?" },
      { from: "me", text: "Yes — real-time chat is fully wired with Socket.io and Redis." },
      { from: "them", text: "Perfect, purchasing now!" },
    ],
  },
  {
    id: "2",
    name: "Mike Otieno",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    preview: "Commercial license question",
    messages: [
      { from: "them", text: "Can I use SecureVault in a client product?" },
      { from: "me", text: "Yes with the Commercial license. Happy to clarify anything." },
    ],
  },
];

export default function MessagesPage() {
  const [active, setActive] = useState(threads[0]);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState(active.messages);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  function selectThread(id: string) {
    const t = threads.find((x) => x.id === id)!;
    setActive(t);
    setMsgs(t.messages);
    setMobileShowChat(true);
  }

  function send() {
    if (!text.trim()) return;
    setMsgs([...msgs, { from: "me", text }]);
    setText("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted">Buyer ↔ seller communication.</p>
      </div>
      <div className="grid gap-4 lg:h-[560px] lg:grid-cols-3">
        <Card
          className={cn(
            "overflow-hidden lg:col-span-1",
            mobileShowChat ? "hidden lg:block" : "block"
          )}
        >
          <CardHeader>
            <CardTitle className="text-base">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => selectThread(t.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl p-3 text-left transition",
                  active.id === t.id ? "bg-primary/20" : "hover:bg-foreground/5"
                )}
              >
                <Avatar>
                  <AvatarImage src={t.avatar} />
                  <AvatarFallback>{t.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.preview}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card
          className={cn(
            "flex min-h-[420px] flex-col lg:col-span-2 lg:min-h-0",
            mobileShowChat ? "flex" : "hidden lg:flex"
          )}
        >
          <CardHeader className="flex flex-row items-center gap-2 border-b border-border">
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
            <CardTitle className="text-base">{active.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2 text-sm sm:max-w-[80%]",
                  m.from === "me"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-foreground/10 text-foreground"
                )}
              >
                {m.text}
              </div>
            ))}
          </CardContent>
          <div className="flex gap-2 border-t border-border p-3 sm:p-4">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="min-w-0"
            />
            <Button onClick={send} className="shrink-0" aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
