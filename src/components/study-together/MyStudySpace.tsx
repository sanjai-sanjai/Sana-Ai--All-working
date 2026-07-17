import { useState, useEffect, useRef } from "react";
import { 
  GraduationCap, BookOpen, ArrowRight, CheckCircle2, 
  Download, Share2, FileText, Sparkles, Target,
  ChevronRight, Brain, Rocket, Send, Loader2, Award, Presentation
} from "lucide-react";
import { ProgressRing } from "@/components/app/ProgressRing";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { SanaMarkdown } from "@/components/sana-markdown";
import { useAuth } from "@/hooks/use-auth";

interface MyStudySpaceProps {
  topicContext?: { id?: string; title: string; assignee: string } | null;
  groupName?: string;
  onStartTeaching?: (topicId: string, title: string) => void;
}

export function MyStudySpace({ 
  topicContext,
  groupName = "Study Group",
  onStartTeaching
}: MyStudySpaceProps) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'learn' | 'practice' | 'quiz' | 'revision' | 'notes'>('learn');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Realtime States
  const [progress, setProgress] = useState(0);
  const [liveNotes, setLiveNotes] = useState<string>("");

  const chatState = useChat({
    api: "/api/study-session",
    body: {
      studentName: user?.user_metadata?.display_name || "Student",
      topicTitle: topicContext?.title || "General Topic",
      groupName: groupName,
      progressPct: progress
    },
    onFinish: async (event: any) => {
      // Parse for notes block
      const notesMatch = event.message.content.match(/```notes\n([\s\S]*?)```/);
      if (notesMatch && notesMatch[1]) {
        setLiveNotes(prev => prev ? prev + "\n" + notesMatch[1] : notesMatch[1]);
      }
      
      // Heuristic: If there's a mini check, we assume some progress is made
      if (event.message.content.includes("Mini Check") && progress < 90) {
        setProgress(p => Math.min(p + 15, 100));
        // Note: Realistically, you would run a Supabase mutation here to update `study_group_topics` progress_pct.
      }
    }
  } as any);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = chatState as any;

  // Auto-start learning when a topic is selected
  useEffect(() => {
    if (topicContext && messages.length === 0) {
      append({
        role: "user",
        content: `I am ready to learn ${topicContext.title}. Please introduce the roadmap and let's begin the first step.`
      });
    }
  }, [topicContext, messages.length, append]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!topicContext) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center bg-[#f8f9fe]">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#6366f1]/10 text-[#6366f1] mb-4">
          <Brain className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No Topic Selected</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-[250px]">
          Head back to the chat and click "Start Learning" on an assignment card to enter your workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8f9fe] px-5 py-6 pb-32 overflow-y-auto" ref={scrollRef}>
      {/* Header Card */}
      <div className="mb-6 rounded-[28px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] p-7 text-white shadow-[0_8px_30px_rgb(99,102,241,0.25)] relative overflow-hidden shrink-0">
        <div className="absolute top-[-30%] right-[-15%] w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-white/20 backdrop-blur-md">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold tracking-tight">AI Workspace</h2>
                <p className="text-[13px] font-medium text-white/75 mt-0.5">{groupName}</p>
              </div>
            </div>
            <ProgressRing value={progress} size={52} stroke={5} className="text-white" label={`${progress}%`} />
          </div>

          <div className="rounded-[18px] bg-white/15 backdrop-blur-sm px-5 py-4 border border-white/10">
            <p className="text-[12px] font-semibold text-white/70 tracking-wide uppercase">Active Topic</p>
            <h3 className="text-[17px] font-bold mt-1.5 leading-snug">{topicContext.title}</h3>
          </div>
        </div>
      </div>

      {/* Teaching Readiness Injection */}
      {progress >= 100 && (
        <div className="mb-6 rounded-[24px] border border-emerald-200 bg-emerald-50/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-5 w-5 text-emerald-600" />
              <h3 className="text-[16px] font-bold text-gray-900">Teaching Readiness: 92%</h3>
            </div>
            <p className="text-[13px] text-gray-600">You've mastered this topic! AI is ready to prepare your teaching materials.</p>
          </div>
          <button 
            onClick={() => onStartTeaching && onStartTeaching(topicContext.id || '', topicContext.title)}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full text-[14px] font-bold transition-colors whitespace-nowrap shadow-sm"
          >
            <Presentation className="h-4 w-4" />
            Prepare to Teach
          </button>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar shrink-0 pb-1">
        {[
          { id: 'learn', label: 'Learn', icon: Brain },
          { id: 'practice', label: 'Practice', icon: Target },
          { id: 'quiz', label: 'Quiz', icon: CheckCircle2 },
          { id: 'revision', label: 'Revision', icon: ArrowRight },
          { id: 'notes', label: 'Notes', icon: FileText },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={cn(
              "flex items-center gap-1.5 rounded-[14px] px-4 py-2.5 text-[13px] font-bold transition-all whitespace-nowrap",
              activeSection === section.id
                ? "bg-[#6366f1] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <section.icon className="h-4 w-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Learn Section (AI Guided Chat) */}
      {activeSection === 'learn' && (
        <div className="flex flex-col gap-4">
          {messages.map((m: any) => (
            <div 
              key={m.id}
              className={cn("flex w-max max-w-[75%] flex-col gap-2 rounded-[20px] px-4 py-3 text-sm animate-in slide-in-from-bottom-2",
                m.role === "user" ? "ml-auto bg-[#6366f1] text-white rounded-br-none" : "bg-white border border-gray-100 text-gray-900 rounded-bl-none"
              )}
            >
              <SanaMarkdown content={m.content} />
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-2 text-[#6366f1] px-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">AI is typing...</span>
            </div>
          )}

          {/* Chat Input for Mini Checks */}
          <div className="sticky bottom-4 mt-6 pt-4">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Answer or ask a question..."
                className="w-full rounded-full border border-gray-200 bg-white px-5 py-3.5 pr-12 text-[14px] text-gray-900 shadow-sm focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 grid h-10 w-10 place-items-center rounded-full bg-[#6366f1] text-white transition-transform active:scale-95 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notes Section */}
      {activeSection === 'notes' && (
        <div className="flex flex-col h-full gap-4">
          {!liveNotes ? (
            <div className="flex flex-col items-center justify-center text-center py-12 bg-white rounded-[24px] border border-gray-100 shadow-sm">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-[#6366f1]/10 text-[#6366f1] mb-5">
                <FileText className="h-10 w-10 stroke-[1.5]" />
              </div>
              <h3 className="text-[18px] font-bold text-gray-900">Live Notes</h3>
              <p className="text-[14px] text-gray-500 mt-2 max-w-[260px]">
                As you learn, AI will generate notes here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 overflow-y-auto prose max-w-none">
              <SanaMarkdown content={liveNotes} />
            </div>
          )}
          <button 
            disabled={!liveNotes}
            className="mt-2 flex items-center justify-center gap-2 rounded-[18px] bg-white border border-gray-200 px-6 py-3.5 text-[15px] font-bold text-[#6366f1] shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            <Share2 className="h-5 w-5" />
            Share to Group Knowledge Hub
          </button>
        </div>
      )}
    </div>
  );
}
