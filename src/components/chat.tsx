"use client";

import { useChat } from "@ai-sdk/react";
import { Loader2Icon, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import type { IsoDate } from "@/lib/nutrition/food-entry";
import { LOCAL_DATE_COOKIE, localToday } from "@/lib/nutrition/local-date";
import type { NutritionTools } from "@/lib/nutrition/tools";

/**
 * The part name the write tool streams back: `tool-` + the tool's key. Tied to
 * the tool set, so renaming the tool breaks the build rather than quietly
 * leaving the rings stale.
 */
const LOG_TOOL_PART = `tool-${"logFoodEntry" satisfies keyof NutritionTools}`;

export type ChatProps = {
  /** The day the server derived the rings from, so we can tell it if it guessed wrong. */
  renderedDate: IsoDate;
};

/**
 * The chat. Every request carries the browser's own calendar day, which is the
 * only thing that decides which day an entry lands on. When a stream finishes
 * in which something was logged, the server is asked to re-derive the totals —
 * the client never adds anything up itself.
 */
export function Chat({ renderedDate }: ChatProps) {
  const router = useRouter();
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    onFinish: ({ message }) => {
      const wrote = message.parts.some((part) => part.type === LOG_TOOL_PART);
      if (wrote) router.refresh();
    },
  });

  // Tell the server which day the browser is on. Only the browser knows.
  useEffect(() => {
    const today = localToday();
    document.cookie = `${LOCAL_DATE_COOKIE}=${today}; path=/; max-age=31536000; samesite=lax`;
    if (today !== renderedDate) router.refresh();
  }, [renderedDate, router]);

  const isResponding = status === "submitted" || status === "streaming";

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text) return;

    sendMessage({ text }, { body: { today: localToday() } });
    setInput("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquare className="size-10" />}
              title="Log what you ate"
              description="Try “that was 400 cal, 30g protein, 40g carbs, 12g fat”."
            />
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <MessageResponse key={`${message.id}-${index}`}>
                        {part.text}
                      </MessageResponse>
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}

          {isResponding && (
            <div
              role="status"
              className="text-muted-foreground flex items-center gap-2 text-sm"
            >
              {/* The wrapper is the live region; the spinner is decoration. */}
              <Loader2Icon aria-hidden className="size-4 animate-spin" />
              Working on it…
            </div>
          )}

          {error && (
            <p role="alert" className="text-destructive text-sm">
              Something went wrong. Try that again.
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="relative w-full">
        <PromptInputTextarea
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          placeholder="What did you eat?"
          className="pr-12"
        />
        <PromptInputSubmit
          status={status}
          disabled={!input.trim() || isResponding}
          className="absolute right-1 bottom-1"
        />
      </PromptInput>
    </div>
  );
}
