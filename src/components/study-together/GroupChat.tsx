import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Download, Check, CheckCheck, FileText, ImageIcon, Video, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { renderWithMentions } from "./AIMentionTag";
import { AITypingIndicator } from "./AITypingIndicator";
import { SanaMarkdown } from "@/components/sana-markdown";
import { SmartTopicDistributionCard } from "./SmartTopicDistributionCard";
import { SmartDistributionIntentCard } from "./SmartDistributionIntentCard";
import { PlanApprovedCard } from "./PlanApprovedCard";
import sanaAvatar from "@/assets/reply-avatar.png";

export interface ChatMessage {
  id: string;
  user_id: string | null; // null for AI
  user_name: string;
  avatar_url?: string | null;
  content: string;
  message_type: 'text' | 'file' | 'ai_roadmap' | 'ai_mention' | 'meet_start' | 'meet_join' | 'meet_end' | 'audio' | 'ai_distribution_proposal' | 'ai_distribution_intent' | 'ai_plan_approved';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  created_at: string;
  is_mine: boolean;
  is_ai: boolean;
  status: 'sent' | 'delivered' | 'read';
  reactions?: { emoji: string; count: number }[];
}

interface GroupChatProps {
  messages: ChatMessage[];
  isAiTyping?: boolean;
  onAction?: (action: string, payload: any) => void;
  isMeetActive?: boolean;
  members?: any[];
}

// Per-user sender name colors to match the reference design
const userNameColors: Record<string, string> = {
  'Hari': 'text-[#059669]',      // Green
  'Akash': 'text-[#e11d48]',     // Rose/Red
  'Naveen': 'text-[#7c3aed]',    // Purple
};

function getUserNameColor(userName: string): string {
  return userNameColors[userName] || 'text-[#e11d48]';
}

/** Check if a message contains the @Sana_AI mention */
function hasMention(content: string): boolean {
  return content.includes('@Sana_AI');
}

/** Render message content — handles @Sana_AI mentions and plain text */
function MessageContent({ content, isAiResponse, onAction }: { content: string; isAiResponse: boolean, onAction?: (action: string, payload: any) => void }) {
  if (isAiResponse) {
    return <SanaMarkdown content={content} onAction={onAction} />;
  }

  if (hasMention(content)) {
    return (
      <p className="text-[15px] leading-[1.65]">
        {renderWithMentions(content)}
      </p>
    );
  }

  return <p className="text-[15px] leading-[1.65]">{content}</p>;
}

export function GroupChat({ messages, isAiTyping = false, onAction, isMeetActive = false, members = [] }: GroupChatProps) {
  return (
    <div className="flex flex-col gap-9 px-3 pb-[200px] pt-6 relative">
      <div className="absolute inset-0 z-[-1] opacity-40 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      {messages.map((msg, idx) => {
        const isConsecutive = idx > 0 && messages[idx - 1].user_id === msg.user_id && messages[idx - 1].is_ai === msg.is_ai;
        const isAiResponse = msg.is_ai && msg.message_type !== 'text' || (msg.is_ai && msg.content.length > 100);

        if (['meet_start', 'meet_join', 'meet_end'].includes(msg.message_type)) {
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={msg.id}
              className="w-full flex justify-center my-2"
            >
              {msg.message_type === 'meet_start' && (
                (() => {
                  // If meet is active, only the last meet_start is considered the active one
                  const isThisActive = isMeetActive && msg.id === messages.filter(m => m.message_type === 'meet_start').pop()?.id;
                  
                  if (isThisActive) {
                    return (
                      <div className="bg-[#f3f0ff] border border-[#6366f1]/30 rounded-2xl p-4 max-w-[80%] w-[400px] flex items-start gap-4 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#6366f1] to-purple-500 animate-pulse" />
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#6366f1] shadow-sm">
                          <Video className="h-5 w-5 fill-current animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[14px] leading-relaxed text-[#4f46e5] font-semibold whitespace-pre-wrap">{msg.content}</p>
                          <span className="text-[11px] text-[#6366f1]/60 font-medium mt-1">{format(new Date(msg.created_at), 'hh:mm a')}</span>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 max-w-[80%] w-[350px] flex items-start gap-4 shadow-sm opacity-70">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-gray-400 shadow-sm">
                          <Video className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[14px] leading-relaxed text-gray-600 font-semibold whitespace-pre-wrap">Study Session Ended</p>
                          <span className="text-[11px] text-gray-400 font-medium mt-1">{format(new Date(msg.created_at), 'hh:mm a')}</span>
                        </div>
                      </div>
                    );
                  }
                })()
              )}
              {msg.message_type === 'meet_join' && (
                <div className="bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 flex items-center gap-2">
                  <UserPlus className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[12.5px] font-medium text-gray-500">{msg.content}</span>
                </div>
              )}
              {msg.message_type === 'meet_end' && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 max-w-[80%] w-[350px] flex items-start gap-4 shadow-sm">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-gray-400 shadow-sm">
                    <Video className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[14px] leading-relaxed text-gray-600 font-semibold whitespace-pre-wrap">{msg.content}</p>
                    <span className="text-[11px] text-gray-400 font-medium mt-1">{format(new Date(msg.created_at), 'hh:mm a')}</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        }

        // AI messages (both system AI and @mention AI responses)
        if (msg.is_ai) {
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className="flex items-start gap-4 w-full"
            >
              {!isConsecutive ? (
                <div className="h-11 w-11 shrink-0 rounded-full overflow-hidden mt-1 shadow-md ring-2 ring-white border-[1.5px] border-[#6366f1]/20 bg-[#f3f0ff]">
                  <img src={sanaAvatar} alt="Sana AI" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="w-11 shrink-0" />
              )}

              <div className="flex max-w-[85%] flex-col">
                {!isConsecutive && (
                  <div className="flex items-baseline gap-2.5 ml-2 mb-2.5">
                    <span className="text-[15.5px] font-bold text-[#6366f1]">
                      {msg.user_name === 'AI Assistant' ? 'AI Assistant' : 'Sana_AI'}
                    </span>
                    <span className="rounded-md bg-[#6366f1] px-2 py-0.5 text-[11px] font-bold text-white tracking-wide shadow-sm">AI</span>
                    <span className="text-[12px] text-gray-400 ml-1.5 font-semibold">
                      {format(new Date(msg.created_at), 'hh:mm a')}
                    </span>
                  </div>
                )}

                <div className={cn(
                  "rounded-[28px] rounded-tl-[10px] bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative",
                  isAiResponse ? "p-6" : "p-6"
                )}>
                  {isAiResponse ? (
                    <>
                      {msg.message_type === 'ai_roadmap' && (
                        <div className="text-[14px] leading-relaxed text-gray-800">
                          <SanaMarkdown content={msg.content} />
                        </div>
                      )}

                      {msg.message_type === 'ai_distribution_intent' && (
                        <div className="-mx-6 -mb-6 mt-4 border-t border-gray-100">
                          <SmartDistributionIntentCard 
                            introText={(() => {
                              try {
                                const jsonMatch = msg.content.match(/```json[\s\r\n]*([\s\S]*?)```/i);
                                const parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : {};
                                return parsed.intro_text || "I can help organize your study. Shall I create a smart topic distribution for the team?";
                              } catch (e) {
                                return "I can help organize your study. Shall I create a smart topic distribution for the team?";
                              }
                            })()}
                            onGenerate={() => onAction?.('generate_distribution', { messageId: msg.id })}
                          />
                        </div>
                      )}

                      {msg.message_type === 'ai_distribution_proposal' && (
                        <div className="-mx-6 -mb-6 mt-4 border-t border-gray-100">
                          <SmartTopicDistributionCard 
                            data={(() => {
                              try {
                                const jsonMatch = msg.content.match(/```json[\s\r\n]*([\s\S]*?)```/i);
                                return jsonMatch ? JSON.parse(jsonMatch[1]) : { type: 'topic_distribution', chapter: 'Unknown', assignments: [] };
                              } catch (e) {
                                return { type: 'topic_distribution', chapter: 'Unknown', assignments: [] };
                              }
                            })()}
                            members={members || []}
                            onApprove={(assignments) => onAction?.('approve_distribution', { messageId: msg.id, assignments })}
                            onCancel={() => onAction?.('cancel_distribution', { messageId: msg.id })}
                            onReassign={() => onAction?.('open_reassign', { messageId: msg.id, data: (() => {
                              try {
                                const jsonMatch = msg.content.match(/```json[\s\r\n]*([\s\S]*?)```/i);
                                return jsonMatch ? JSON.parse(jsonMatch[1]) : { type: 'topic_distribution', chapter: 'Unknown', assignments: [] };
                              } catch (e) {
                                return { type: 'topic_distribution', chapter: 'Unknown', assignments: [] };
                              }
                            })()})}
                          />
                        </div>
                      )}

                      {msg.message_type === 'ai_plan_approved' && (
                        <div className="-mx-6 -mb-6 mt-4 border-t border-gray-100">
                          <PlanApprovedCard 
                            assignments={(() => {
                              try {
                                const jsonMatch = msg.content.match(/```json[\s\r\n]*([\s\S]*?)```/i);
                                return jsonMatch ? JSON.parse(jsonMatch[1]).assignments : [];
                              } catch (e) {
                                return [];
                              }
                            })()}
                            members={members || []}
                            onGoToSpace={() => onAction?.('go_to_study_space', {})}
                          />
                        </div>
                      )}

                      {(!msg.message_type || msg.message_type === 'text') && (
                        <div className="text-[13px] leading-relaxed text-gray-800">
                          <SanaMarkdown content={msg.content} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-[15px] leading-[1.7] text-gray-800 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }}>
                    </div>
                  )}

                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="absolute -bottom-3.5 left-4 flex gap-1.5">
                      {msg.reactions.map((r, i) => (
                        <div key={i} className="flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1 shadow-sm">
                          <span className="text-[13px]">{r.emoji}</span>
                          <span className="text-[12px] font-bold text-gray-600">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        }

        // Human messages
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={cn("flex items-start gap-4 max-w-[85%]", msg.is_mine ? "ml-auto flex-row-reverse" : "")}
          >
            {!msg.is_mine && !isConsecutive && (
              <div className="h-12 w-12 shrink-0 rounded-full bg-gray-100 overflow-hidden mt-1 shadow-sm border-[2px] border-white ring-1 ring-gray-100/50">
                {msg.avatar_url ? (
                  <img src={msg.avatar_url} alt={msg.user_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[#f8f9fa] text-[14px] font-bold text-gray-700">
                    {msg.user_name.substring(0, 1)}
                  </div>
                )}
              </div>
            )}

            {(!msg.is_mine && isConsecutive) && <div className="w-11 shrink-0" />}

            <div className={cn("flex flex-col", msg.is_mine ? "items-end" : "items-start")}>
              {!msg.is_mine && !isConsecutive && (
                <div className="flex items-baseline gap-3 ml-2 mb-2.5">
                  <span className={cn("text-[15.5px] font-bold", getUserNameColor(msg.user_name))}>{msg.user_name}</span>
                  <span className="text-[12px] text-gray-400 font-semibold">
                    {format(new Date(msg.created_at), 'hh:mm a')}
                  </span>
                </div>
              )}

              {msg.is_mine && !isConsecutive && (
                <div className="flex items-baseline gap-3 mr-2 mb-2.5">
                  <span className="text-[15.5px] font-bold text-[#10b981]">You</span>
                  <span className="text-[12px] text-gray-400 font-semibold">
                    {format(new Date(msg.created_at), 'hh:mm a')}
                  </span>
                </div>
              )}

              <div
                className={cn(
                  "relative rounded-[28px] p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)]",
                  msg.is_mine
                    ? "bg-[#E8F5E9] text-gray-900 rounded-tr-[10px]"
                    : "bg-white border border-gray-100/50 text-gray-900 rounded-tl-[10px]"
                )}
              >
                {msg.message_type === 'text' && (
                  <MessageContent content={msg.content} isAiResponse={false} />
                )}

                {msg.message_type === 'file' && (
                  <div className="flex items-center gap-4 bg-white/60 p-4 rounded-[22px] border border-gray-200/60 min-w-[280px]">
                    <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl bg-[#fee2e2] text-[#ef4444] shadow-sm">
                      <FileText className="h-[26px] w-[26px] fill-current" />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="truncate text-[15.5px] font-bold text-gray-900 leading-tight mb-1">{msg.file_name}</p>
                      <p className="text-[13px] text-gray-500 font-semibold tracking-[-0.01em]">
                        {msg.file_size ? (msg.file_size / 1024 / 1024).toFixed(1) + ' MB' : ''} • PDF
                      </p>
                    </div>
                    <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white shadow-[0_2px_10px_rgb(0,0,0,0.06)] border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all">
                      <Download className="h-[20px] w-[20px] text-gray-700 stroke-[2.5]" />
                    </button>
                  </div>
                )}

                {msg.message_type === 'audio' && msg.file_url && (
                  <div className="mt-1">
                    <audio 
                      controls 
                      src={msg.file_url} 
                      className={cn(
                        "h-12 w-full min-w-[240px] max-w-[320px] rounded-full outline-none",
                        msg.is_mine ? "opacity-100" : "opacity-90"
                      )} 
                    />
                  </div>
                )}

                <div className={cn(
                  "flex items-center gap-1.5 mt-2.5",
                  msg.is_mine ? "justify-end text-[#3b82f6]" : "justify-end text-gray-400"
                )}>
                  {msg.is_mine && msg.status === 'read' && <CheckCheck className="h-[18px] w-[18px]" />}
                  {msg.is_mine && msg.status === 'delivered' && <CheckCheck className="h-[18px] w-[18px]" />}
                  {msg.is_mine && msg.status === 'sent' && <Check className="h-[18px] w-[18px]" />}
                </div>

                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={cn(
                    "absolute -bottom-4 flex gap-1.5",
                    msg.is_mine ? "right-4" : "left-4"
                  )}>
                    {msg.reactions.map((r, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded-full bg-white border border-gray-100 px-3 py-1.5 shadow-[0_2px_10px_rgb(0,0,0,0.08)]">
                        <span className="text-[14px]">{r.emoji}</span>
                        <span className="text-[13px] font-bold text-gray-700">{r.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* AI Typing Indicator */}
      <AnimatePresence>
        {isAiTyping && <AITypingIndicator />}
      </AnimatePresence>
    </div>
  );
}
