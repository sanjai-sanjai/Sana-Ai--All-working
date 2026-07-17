import { Mic, Send, AtSign, X } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  onSendMessage: (content: string, type: 'text' | 'file') => void;
}

export function ChatComposer({ onSendMessage }: ChatComposerProps) {
  const [message, setMessage] = useState("");
  const [isMentioned, setIsMentioned] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Build the final message content: prepend @Sana_AI if mentioned
  const buildFinalMessage = () => {
    const trimmed = message.trim();
    if (!trimmed) return "";
    return isMentioned ? `@Sana_AI ${trimmed}` : trimmed;
  };

  const handleSend = () => {
    const finalMsg = buildFinalMessage();
    if (!finalMsg) return;
    onSendMessage(finalMsg, 'text');
    setMessage("");
    setIsMentioned(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMentionAI = () => {
    if (!isMentioned) {
      setIsMentioned(true);
    }
    // Focus the textarea so user can start typing immediately
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const removeMention = () => {
    setIsMentioned(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const hasContent = message.trim().length > 0 || isMentioned;

  return (
    <div className="absolute bottom-0 left-0 w-full z-20 bg-white/95 px-4 pb-8 pt-3 backdrop-blur-xl border-t border-gray-100/80">
      {/* Mention AI hint bar */}
      {isMentioned && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-[#6366f1]/8 px-3 py-2 border border-[#6366f1]/15 max-w-[800px] mx-auto">
          <AtSign className="h-3.5 w-3.5 text-[#6366f1]" />
          <span className="text-[12px] font-semibold text-[#6366f1]">Sana AI will respond to this message</span>
        </div>
      )}

      <div className="flex items-end gap-2 max-w-[800px] mx-auto">
        {/* Left action buttons: + and Mic */}
        <div className="flex items-center gap-1.5 mb-1">
          <button className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full bg-[#f3f0ff] text-[#6366f1] hover:bg-[#e8e5ff] active:scale-95 transition-all">
            <span className="text-[26px] font-light leading-none relative -top-[1px]">+</span>
          </button>
          <button 
            className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 active:scale-95 transition-all"
            title="Voice message"
          >
            <Mic className="h-[18px] w-[18px] stroke-[2]" />
          </button>
        </div>

        {/* Input area */}
        <div className={cn(
          "flex min-h-[44px] flex-1 items-center rounded-[22px] border bg-[#f8f9fa] px-2 shadow-sm transition-all mb-1",
          isMentioned 
            ? "border-[#6366f1]/40 ring-1 ring-[#6366f1]/20" 
            : "border-gray-200 focus-within:border-[#6366f1] focus-within:ring-1 focus-within:ring-[#6366f1]/30"
        )}>
          {/* @Sana_AI mention chip — shown inside input when active */}
          {isMentioned && (
            <div className="flex items-center gap-1 rounded-full bg-[#6366f1]/12 border border-[#6366f1]/25 pl-2 pr-1 py-1 ml-1 shrink-0">
              <AtSign className="h-3 w-3 text-[#6366f1] stroke-[2.5]" />
              <span className="text-[12px] font-bold text-[#6366f1] whitespace-nowrap">Sana_AI</span>
              <button 
                onClick={removeMention}
                className="grid h-[18px] w-[18px] place-items-center rounded-full hover:bg-[#6366f1]/20 transition-colors"
              >
                <X className="h-3 w-3 text-[#6366f1] stroke-[2.5]" />
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isMentioned ? "Ask Sana AI something..." : "Message the group..."}
            className="max-h-[140px] min-h-[44px] flex-1 resize-none bg-transparent py-2.5 pl-2 text-[15px] font-medium placeholder:text-gray-400 text-gray-900 focus:outline-none scrollbar-hide"
            rows={1}
          />
          
          {/* @ Sana AI mention button — inside input bar */}
          {!isMentioned && (
            <button 
              onClick={handleMentionAI}
              className="flex items-center gap-1 shrink-0 rounded-full px-2.5 py-1.5 mr-0.5 text-gray-400 hover:text-[#6366f1] hover:bg-[#6366f1]/8 active:scale-95 transition-all group"
              title="Mention @Sana AI"
            >
              <AtSign className="h-[16px] w-[16px] stroke-[2.5]" />
              <span className="text-[11px] font-bold whitespace-nowrap group-hover:text-[#6366f1]">Sana AI</span>
            </button>
          )}
        </div>
        
        {/* Send button — always visible */}
        <button 
          onClick={handleSend}
          disabled={!message.trim()}
          className={cn(
            "grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full shadow-[0_4px_14px_rgb(99,102,241,0.35)] active:scale-95 transition-all mb-1",
            message.trim()
              ? "bg-[#6366f1] text-white hover:opacity-90 cursor-pointer"
              : "bg-[#6366f1]/40 text-white/70 cursor-not-allowed shadow-none"
          )}
        >
          <Send className="h-[20px] w-[20px] ml-0.5 stroke-[2]" />
        </button>
      </div>
    </div>
  );
}
