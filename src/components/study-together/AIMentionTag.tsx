import { cn } from "@/lib/utils";
import { AtSign } from "lucide-react";

interface AIMentionTagProps {
  className?: string;
}

/**
 * Inline @Sana_AI mention tag rendered inside chat message bubbles.
 * Purple pill with bot icon — consistent with WhatsApp @mention styling.
 */
export function AIMentionTag({ className }: AIMentionTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-[#6366f1]/15 px-1.5 py-0.5 text-[13px] font-bold text-[#6366f1] align-baseline",
        className,
      )}
    >
      <AtSign className="inline h-3 w-3 stroke-[2.5]" />
      Sana_AI
    </span>
  );
}

/**
 * Utility: Replace all occurrences of @Sana_AI in a text string
 * with a React node containing the styled AIMentionTag component.
 */
export function renderWithMentions(text: string): React.ReactNode[] {
  const parts = text.split(/(@Sana_AI)/g);
  return parts.map((part, i) => {
    if (part === "@Sana_AI") {
      return <AIMentionTag key={i} />;
    }
    return <span key={i}>{part}</span>;
  });
}
