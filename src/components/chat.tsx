"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatStatus } from "ai";
import { CameraIcon, Loader2Icon, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteFoodEntry } from "@/app/actions";

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
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
import { EntryCard } from "@/components/entry-card";
import { LabelPhoto } from "@/components/label-photo";
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import type { NutritionUIMessage } from "@/lib/chat/message";
import type { NutritionTools } from "@/lib/nutrition/tools";

/**
 * The part names the write tools stream back: `tool-` + the tool's key. Tied to
 * the tool set, so renaming a tool breaks the build rather than quietly leaving
 * the rings stale.
 */
const LOG_TOOL_PART =
  `tool-${"logFoodEntry" satisfies keyof NutritionTools}` as const;
const DELETE_TOOL_PART =
  `tool-${"deleteFoodEntry" satisfies keyof NutritionTools}` as const;

/** Whether a message did something the rings would have to catch up with. */
function wroteToTheLog(message: NutritionUIMessage): boolean {
  return message.parts.some(
    (part) => part.type === LOG_TOOL_PART || part.type === DELETE_TOOL_PART,
  );
}

/** Whether a reply is on its way, which is when the composer stops accepting. */
function isResponding(status: ChatStatus): boolean {
  return status === "submitted" || status === "streaming";
}

/** The photo waiting to be sent, shown above the textarea so it can be undone. */
function LabelPhotoPreview() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;

  return (
    <PromptInputHeader>
      {/* The grid variant right-aligns for message bubbles; in the composer the
          photo belongs on the left, where the text starts. */}
      <Attachments variant="grid" className="mr-auto ml-0">
        {attachments.files.map((file) => (
          <Attachment
            key={file.id}
            data={file}
            onRemove={() => attachments.remove(file.id)}
          >
            <AttachmentPreview />
            <AttachmentRemove />
          </Attachment>
        ))}
      </Attachments>
    </PromptInputHeader>
  );
}

/**
 * Asks for the label photo. The input behind this is capture-capable, so a
 * phone opens its camera rather than a file browser; on desktop it is an
 * ordinary file picker.
 *
 * The photo rides along on the user's message and is therefore already in the
 * model's context — nothing here extracts numbers from it.
 */
function LabelPhotoButton() {
  const attachments = usePromptInputAttachments();

  return (
    <PromptInputButton
      onClick={attachments.openFileDialog}
      tooltip="Attach a nutrition label photo"
      aria-label="Attach a nutrition label photo"
    >
      <CameraIcon className="size-4" />
    </PromptInputButton>
  );
}

/**
 * Sends whatever the composer holds. A photo with no words is a message worth
 * sending, so an attachment alone enables it.
 */
function ComposerSubmit({
  text,
  status,
}: {
  text: string;
  status: ChatStatus;
}) {
  const attachments = usePromptInputAttachments();
  const hasSomethingToSay =
    text.trim().length > 0 || attachments.files.length > 0;

  return (
    <PromptInputSubmit
      status={status}
      disabled={!hasSomethingToSay || isResponding(status)}
    />
  );
}

/**
 * Only the newest message goes up. The server holds the day's conversation and
 * appends to it, so history is neither re-sent nor open to being rewritten from
 * here — and a label photo is uploaded once rather than with every message that
 * follows it.
 */
const transport = new DefaultChatTransport<NutritionUIMessage>({
  api: "/api/chat",
  prepareSendMessagesRequest: ({ messages }) => ({
    body: { message: messages[messages.length - 1] },
  }),
});

/**
 * The chat. It sends no date: which day an entry lands on is the server's to
 * decide. When a stream finishes in which something was logged, the server is
 * asked to re-derive the totals — the client never adds anything up itself.
 *
 * The day's conversation arrives already written, read from the server, so a
 * reload resumes rather than restarts.
 *
 * A tab left open across midnight keeps yesterday's header until it navigates
 * or reloads. Nothing is mis-recorded — the server stamps each write with its
 * own day — and a clock on the client is exactly the machinery this arrangement
 * exists to avoid.
 */
export function Chat({
  initialMessages,
}: {
  initialMessages: NutritionUIMessage[];
}) {
  const router = useRouter();
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat<NutritionUIMessage>({
    messages: initialMessages,
    transport,
    onFinish: ({ message }) => {
      if (wroteToTheLog(message)) router.refresh();
    },
  });

  /**
   * The card's delete control. The delete lands on the server, then the server
   * re-derives the totals — the rings drop out of that, not out of any sum kept
   * here.
   */
  const deleteEntry = async (id: number) => {
    await deleteFoodEntry(id);
    router.refresh();
  };

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    // A label photo on its own is a message: the amount can follow in the next
    // one, and the model asks for it.
    if (!text && message.files.length === 0) return;

    sendMessage(
      text ? { text, files: message.files } : { files: message.files },
    );
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
                  {message.parts.map((part, index) => {
                    const key = `${message.id}-${index}`;

                    if (part.type === "text") {
                      return (
                        <MessageResponse key={key}>{part.text}</MessageResponse>
                      );
                    }

                    // A committed entry, shown back with what it actually
                    // contributed and a one-click way to take it off again.
                    if (
                      part.type === LOG_TOOL_PART &&
                      part.state === "output-available"
                    ) {
                      return (
                        <EntryCard
                          key={key}
                          entry={part.output}
                          onDelete={deleteEntry}
                        />
                      );
                    }

                    // The label photo, shown back so the user can see which
                    // packet an entry came from. After a reload it is a marker
                    // rather than the picture; the tile says one was sent.
                    if (part.type === "file") {
                      return <LabelPhoto key={key} id={key} part={part} />;
                    }

                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}

          {isResponding(status) && (
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

      <PromptInput
        onSubmit={handleSubmit}
        className="w-full"
        accept="image/*"
        capture="environment"
        maxFiles={1}
      >
        <LabelPhotoPreview />
        <PromptInputTextarea
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          placeholder="What did you eat?"
        />
        <PromptInputFooter>
          <LabelPhotoButton />
          <ComposerSubmit text={input} status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
