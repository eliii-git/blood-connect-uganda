import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatEAT } from "@/lib/uganda";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages | BloodNet+ Uganda" },
      { name: "description", content: "Real-time coordination chat between donors and facilities." },
      { property: "og:title", content: "Messages | BloodNet+ Uganda" },
      { property: "og:description", content: "Real-time coordination chat on BloodNet+." },
    ],
  }),
  component: Messages,
});

function Messages() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [text, setText] = useState("");

  const chats = useQuery({
    queryKey: ["chats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const messages = useQuery({
    queryKey: ["messages", activeChat],
    enabled: !!activeChat,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", activeChat!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!activeChat) return;
    const channel = supabase
      .channel(`chat-${activeChat}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: ["messages", activeChat] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, qc]);

  const send = useMutation({
    mutationFn: async () => {
      if (!text.trim() || !activeChat) return;
      const { error } = await supabase
        .from("messages")
        .insert({ chat_id: activeChat, sender_id: user!.id, body: text.trim().slice(0, 1000) });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["messages", activeChat] });
    },
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(chats.data ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChat(c.id)}
              className={`w-full rounded-lg border p-3 text-left text-sm ${
                activeChat === c.id ? "border-primary bg-accent" : "border-border"
              }`}
            >
              {c.title ?? "Coordination chat"}
            </button>
          ))}
          {chats.isSuccess && !chats.data?.length && (
            <p className="text-sm text-muted-foreground">
              Conversations appear when you respond to an emergency.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="flex min-h-[60vh] flex-col">
        <CardContent className="flex-1 space-y-3 overflow-y-auto pt-6">
          {(messages.data ?? []).map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] rounded-xl p-3 text-sm ${
                m.sender_id === user?.id
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p>{m.body}</p>
              <p className="mt-1 text-[10px] opacity-70">{formatEAT(m.created_at)}</p>
            </div>
          ))}
          {!activeChat && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Select a conversation to start messaging.
            </p>
          )}
        </CardContent>
        <div className="flex gap-2 border-t border-border p-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message"
            disabled={!activeChat}
            onKeyDown={(e) => e.key === "Enter" && send.mutate()}
          />
          <Button onClick={() => send.mutate()} disabled={!activeChat || !text.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}