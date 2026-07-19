import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, BookOpen, ArrowRight, CheckCircle2, 
  Sparkles, Target, Brain, Rocket, Send, Loader2, Award, Presentation,
  ChevronRight, Trophy, Lock, Unlock, Zap, FileText, Clock, Flame, X
} from "lucide-react";
import { ProgressRing } from "@/components/app/ProgressRing";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { SanaMarkdown } from "@/components/sana-markdown";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { generateMissionRoadmap } from "@/lib/roadmap.functions";
import sanaHero from "@/assets/sana-hero.png";

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
  const generateMission = useServerFn(generateMissionRoadmap);
  
  const [phase, setPhase] = useState<'analyzing' | 'mission' | 'roadmap' | 'completed'>('analyzing');
  const [missionData, setMissionData] = useState<any>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [liveNotes, setLiveNotes] = useState<string>("");
  const [isRoadmapExpanded, setIsRoadmapExpanded] = useState(false);
  const [heroDismissed, setHeroDismissed] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!topicContext?.id || !user?.id) return;
    let isMounted = true;
    
    const initMission = async () => {
      try {
        setPhase('analyzing');
        const res = await generateMission({
          data: {
            topicTitle: topicContext.title || "General Topic",
            studentName: user.user_metadata?.display_name || "Student",
          }
        });
        if (!isMounted) return;
        setMissionData(res);
        if (res.roadmap?.length > 0) setActiveNodeId(res.roadmap[0].id);
        
        // If they already have progress, jump straight to roadmap
        if (progress > 0) {
          setPhase('roadmap');
        } else {
          setPhase('mission');
        }
      } catch (err: any) {
        console.error(err);
        toast.error(`Failed to generate mission: ${err.message || String(err)}`);
      }
    };
    
    initMission();

    return () => { isMounted = false; }
  }, [topicContext?.id, user?.id]);

  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/study-session",
      body: () => ({
        studentName: user?.user_metadata?.display_name || "Student",
        topicTitle: topicContext?.title || "General Topic",
        groupName: groupName,
        progressPct: progress,
        activeNode: missionData?.roadmap?.find((n: any) => n.id === activeNodeId)
      })
    })
  ).current;

  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);

  const chatState = useChat({
    id: "study-session-" + (topicContext?.id || "new"),
    transport,
    onFinish: async ({ message }: any) => {
      const fullText = message.parts?.map((p: any) => p.type === "text" ? p.text : "").join("") || message.content || "";
      const notesMatch = fullText.match(/```notes\n([\s\S]*?)```/);
      if (notesMatch && notesMatch[1]) {
        setLiveNotes(prev => prev ? prev + "\n" + notesMatch[1] : notesMatch[1]);
      }
      
      if (fullText.includes("Mini Check")) {
        setProgress(p => {
          if (p >= 90) return p;
          const nextP = Math.min(p + 15, 100);
          if (topicContext?.id && user?.id) {
            supabase.from("progress_tracking").upsert({
              group_id: topicContext.id,
              member_id: user.id,
              assignment_id: topicContext.id,
              progress_pct: nextP
            }).then();
            
            // AI Focus Score Integration: Reward XP for progress
            supabase.from("xp_history").insert({
              user_id: user.id,
              amount: 20,
              reason: "Completed AI Mini Check"
            }).then();
          }
          if (nextP >= 100) setPhase('completed');
          return nextP;
        });
      }

      if (topicContext?.id && user?.id && fullText.trim()) {
         supabase.from('study_space_messages').insert({
            workspace_id: topicContext.id,
            user_id: user.id,
            role: 'assistant',
            message: fullText
         }).then();
      }
    }
  } as any);

  const { messages = [], setMessages, sendMessage, status } = chatState as any;
  const isLoading = status === "submitted" || status === "streaming";
  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !sendMessage) return;
    
    if (topicContext?.id && user?.id) {
       supabase.from('study_space_messages').insert({
          workspace_id: topicContext.id,
          user_id: user.id,
          role: 'user',
          message: input.trim()
       }).then();
    }
    sendMessage({ role: "user", content: input.trim() });
    setInput("");
  };

  useEffect(() => {
    if (topicContext?.id && user?.id) {
      supabase.from('study_space_messages')
        .select('*')
        .eq('workspace_id', topicContext.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .then(({ data, error }) => {
          if (data && data.length > 0) {
            const formatted = data.map(m => ({
              id: m.id,
              role: m.role,
              content: m.message
            }));
            setInitialMessages(formatted);
            setMessages(formatted);
          }
          setHasLoadedMessages(true);
        });

      supabase.from('progress_tracking')
        .select('progress_pct')
        .eq('assignment_id', topicContext.id)
        .eq('member_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setProgress(data.progress_pct || 0);
            if (data.progress_pct >= 100) setPhase('completed');
          }
        });

      const msgSub = supabase.channel(`messages-${topicContext.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', schema: 'public', table: 'study_space_messages', 
          filter: `workspace_id=eq.${topicContext.id}` 
        }, payload => {
          if (payload.new.user_id === user.id) {
            setMessages((prev: any[]) => {
              if (prev.find(p => p.content === payload.new.message)) return prev;
              return [...prev, { id: payload.new.id, role: payload.new.role, content: payload.new.message }];
            });
          }
        }).subscribe();

      const progSub = supabase.channel(`progress-${topicContext.id}`)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'progress_tracking',
          filter: `assignment_id=eq.${topicContext.id}`
        }, payload => {
          if (payload.new.member_id === user.id) {
            setProgress(payload.new.progress_pct || 0);
            if (payload.new.progress_pct >= 100 && phase !== 'completed') {
              setPhase('completed');
            }
          }
        }).subscribe();

      return () => {
        supabase.removeChannel(msgSub);
        supabase.removeChannel(progSub);
      };
    } else {
      setHasLoadedMessages(true);
    }
  }, [topicContext?.id, user?.id, setMessages, phase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, phase]);

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

  const handleNodeClick = (node: any) => {
    setActiveNodeId(node.id);
    sendMessage({ role: "user", content: `I'm ready for the next phase: ${node.title}. Let's focus on: ${node.description}` });
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fe] overflow-hidden relative">
      <AnimatePresence mode="wait">
        
        {/* PHASE 1: ANALYZING */}
        {phase === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative h-24 w-24 mb-6">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#6366f1] border-r-[#8b5cf6] border-b-[#d946ef]" />
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Brain className="h-8 w-8 text-[#6366f1]" />
              </div>
            </div>
            <h2 className="text-[22px] font-black text-gray-900 tracking-tight">AI is analyzing your profile...</h2>
            <div className="mt-4 space-y-2">
              <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-sm font-medium text-gray-500">Evaluating weak areas in {topicContext.title}...</motion.p>
              <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="text-sm font-medium text-gray-500">Adapting to your visual learning style...</motion.p>
              <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5 }} className="text-sm font-medium text-[#6366f1]">Generating personalized mission...</motion.p>
            </div>
          </motion.div>
        )}

        {/* PHASE 2: MISSION BRIEFING (PREMIUM DASHBOARD) */}
        {phase === 'mission' && missionData && (
          <motion.div key="mission" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} 
            className="flex-1 flex flex-col overflow-y-auto pb-32 no-scrollbar bg-[#f8f9fe]">
            
            <div className="mx-auto w-full max-w-2xl p-4 md:p-6 space-y-6 mt-4">
              
              {/* SECTION 1: LEARNING MISSION CARD */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#9333ea] p-6 md:p-8 shadow-xl shadow-indigo-500/20"
              >
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner border border-white/20">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-[24px] md:text-[28px] font-black text-white leading-tight">Today's Learning Mission</h1>
                      <p className="text-[13px] font-medium text-white/80">{topicContext.title}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
                      <span className="text-[13px] font-bold text-white">{missionData.mission.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2.5">
                      <Clock className="h-4 w-4 text-white/80" />
                      <span className="text-[13px] font-bold text-white">{missionData.mission.estimatedTime}</span>
                    </div>
                  </div>

                  <div className="bg-black/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-2">Today's Goal</p>
                    <p className="text-[15px] font-medium text-white leading-relaxed">{missionData.mission.expectedOutcome}</p>
                  </div>

                  <p className="text-[14px] italic font-medium text-white/90 border-l-2 border-pink-400 pl-4 mt-2">
                    "Sana believes you're ready to master this topic today!"
                  </p>
                </div>
              </motion.div>

              {/* SECTION 2 & 7: MISSION PROGRESS & REAL-TIME STATUS */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 rounded-[24px] bg-white border border-gray-100 shadow-sm p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] font-bold text-gray-900">Mission Progress</h3>
                    <span className="text-[15px] font-black text-[#6366f1]">{Math.round((progress / 100) * missionData.roadmap.length)} of {missionData.roadmap.length} Checkpoints</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden mb-4">
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full relative"
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-between text-[12px] font-bold text-gray-500">
                    <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-orange-400" /> +120 XP Projected</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-blue-400" /> {missionData.mission.estimatedTime} Remaining</span>
                  </div>
                </div>

                <div className="rounded-[24px] bg-white border border-gray-100 shadow-sm p-6 flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Real-Time Status</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-[14px] font-bold text-gray-900">In Progress</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[12px] font-medium text-gray-500">Started: 9:15 AM</p>
                    <p className="text-[12px] font-medium text-gray-500">Active: Just now</p>
                  </div>
                </div>
              </motion.div>

              {/* SECTION 4: QUICK ACTIONS */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-3 gap-3">
                <button className="flex flex-col items-center justify-center gap-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-4 active:scale-95 transition-transform">
                  <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-500 grid place-items-center"><BookOpen className="h-5 w-5" /></div>
                  <span className="text-[12px] font-bold text-gray-700">Notes</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-4 active:scale-95 transition-transform">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 grid place-items-center"><FileText className="h-5 w-5" /></div>
                  <span className="text-[12px] font-bold text-gray-700">Resources</span>
                </button>
                <button onClick={() => setPhase('roadmap')} className="flex flex-col items-center justify-center gap-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-4 active:scale-95 transition-transform">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-500 grid place-items-center"><Brain className="h-5 w-5" /></div>
                  <span className="text-[12px] font-bold text-gray-700">Ask Sana</span>
                </button>
              </motion.div>

              {/* SECTION 3: ROADMAP PREVIEW */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-[24px] bg-white border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2"><Rocket className="h-4 w-4 text-[#6366f1]" /> Today's Journey</h3>
                  <button onClick={() => setPhase('roadmap')} className="text-[12px] font-bold text-[#6366f1] hover:underline">View Full</button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full"><CheckCircle2 className="h-3.5 w-3.5" /> Prerequisites</span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                  {missionData.roadmap.slice(0, 3).map((node: any, i: number) => (
                    <React.Fragment key={node.id}>
                      <span className="text-[13px] font-bold text-gray-700 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">{node.title}</span>
                      {i < 2 && <ArrowRight className="h-3.5 w-3.5 text-gray-300" />}
                    </React.Fragment>
                  ))}
                  {missionData.roadmap.length > 3 && (
                    <>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                      <span className="text-[13px] font-bold text-gray-400">+{missionData.roadmap.length - 3} more</span>
                    </>
                  )}
                </div>
              </motion.div>

              {/* SECTION 5 & 6: AI TIP & GAMIFICATION */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                <div className="rounded-[24px] bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] border border-orange-100 p-6 relative overflow-hidden">
                  <div className="absolute top-2 right-2 opacity-10"><Zap className="h-24 w-24 text-orange-500" /></div>
                  <h3 className="text-[13px] font-bold text-orange-600 flex items-center gap-1.5 mb-3"><Sparkles className="h-4 w-4" /> AI Daily Tip</h3>
                  <p className="text-[14px] font-medium text-orange-900/80 leading-relaxed relative z-10">
                    Since you're a visual learner, focus on the diagrams and architecture layouts in the resources before attempting the coding examples today.
                  </p>
                </div>

                <div className="rounded-[24px] bg-white border border-gray-100 shadow-sm p-6 relative">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Learning Streak</p>
                      <p className="text-[18px] font-black text-gray-900 flex items-center gap-1.5"><Flame className="h-5 w-5 text-orange-500 fill-orange-500" /> 12 Days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">XP Today</p>
                      <p className="text-[18px] font-black text-[#4ade80]">+140</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Next Badge</p>
                      <p className="text-[13px] font-bold text-gray-700">Python Explorer</p>
                    </div>
                    <span className="text-[13px] font-black text-[#6366f1]">80%</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.button 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                onClick={() => setPhase('roadmap')}
                className="w-full flex items-center justify-center gap-2 bg-[#6366f1] text-white py-4 rounded-2xl font-bold text-[16px] shadow-lg shadow-[#6366f1]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Rocket className="h-5 w-5" />
                Start Mission Sequence
              </motion.button>
              
            </div>
          </motion.div>
        )}

        {/* PHASE 3: INTERACTIVE ROADMAP & COACH */}
        {phase === 'roadmap' && missionData && (
          <motion.div key="roadmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Top Area: Team Presence Strip */}
            <div className="w-full shrink-0 bg-white border-b border-gray-100 p-3 flex overflow-x-auto gap-3 no-scrollbar z-20 relative">
              {[
                { name: user?.user_metadata?.display_name || "You", avatar: user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=You", status: "online", text: "Studying Data Types", progress: Math.round(progress) || 35 },
                { name: "Alex T.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", status: "online", text: "Studying Variables", progress: 15 },
                { name: "Sarah M.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", status: "offline", text: "Completed Variables", progress: 15 },
                { name: "Mike R.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike", status: "away", text: "Away 5m ago", progress: 10 },
              ].map((member, i) => (
                <div key={i} className="flex-shrink-0 flex items-center gap-3 bg-gray-50/80 border border-gray-100 rounded-full py-1.5 pl-1.5 pr-4 shadow-sm hover:bg-gray-100 transition-colors cursor-default">
                  <div className="relative">
                    <img src={member.avatar} alt={member.name} className="h-8 w-8 rounded-full border-2 border-white shadow-sm bg-white" />
                    <span className={cn(
                      "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white",
                      member.status === 'online' ? "bg-emerald-500 animate-pulse" : member.status === 'away' ? "bg-amber-500" : "bg-gray-300"
                    )} />
                  </div>
                  <div className="flex flex-col justify-center gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-gray-900 leading-none">{member.name}</span>
                      <span className="text-[10px] font-bold text-[#6366f1] bg-[#6366f1]/10 px-1.5 py-0.5 rounded-full leading-none">{member.progress}%</span>
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 leading-none">{member.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Area: Roadmap Timeline */}
            <div className={cn("w-full shrink-0 bg-white border-b border-gray-100 flex flex-col overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)] z-10 transition-all duration-300", isRoadmapExpanded ? "h-[50%]" : "h-auto")}>
              <button 
                onClick={() => setIsRoadmapExpanded(!isRoadmapExpanded)}
                className="w-full text-left p-4 border-b border-gray-100 bg-white shrink-0 flex items-center justify-between active:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="font-bold text-[15px] text-gray-900 flex items-center gap-2">
                    Your Roadmap
                    <ChevronRight className={cn("h-4 w-4 text-gray-400 transition-transform", isRoadmapExpanded ? "-rotate-90" : "rotate-90")} />
                  </h3>
                  <p className="text-[12px] font-medium text-gray-500 line-clamp-1 mt-0.5">{topicContext.title}</p>
                </div>
                <ProgressRing value={progress} size={38} stroke={3} label={`${Math.round(progress)}%`} />
              </button>
              
              {isRoadmapExpanded && (
                <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-1">
                {missionData.roadmap.map((node: any, idx: number) => {
                  const isActive = activeNodeId === node.id;
                  const isCompleted = progress > (idx / missionData.roadmap.length) * 100;
                  
                  return (
                    <button 
                      key={node.id}
                      onClick={() => handleNodeClick(node)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl transition-all border flex gap-3 relative",
                        isActive ? "bg-[#6366f1]/5 border-[#6366f1]/20 shadow-sm" : 
                        isCompleted ? "bg-white border-transparent hover:bg-gray-50" : "bg-white border-transparent opacity-70 hover:bg-gray-50"
                      )}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isCompleted && !isActive ? (
                          <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center"><CheckCircle2 className="h-4 w-4" /></div>
                        ) : isActive ? (
                          <div className="h-6 w-6 rounded-full bg-[#6366f1] text-white grid place-items-center"><Zap className="h-3.5 w-3.5" /></div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-100 text-gray-400 grid place-items-center"><Lock className="h-3.5 w-3.5" /></div>
                        )}
                      </div>
                      <div>
                        <h4 className={cn("text-[14px] font-bold leading-tight", isActive ? "text-[#6366f1]" : "text-gray-900")}>{node.title}</h4>
                        {isActive && <p className="text-[12px] mt-1.5 text-gray-600 leading-snug">{node.description}</p>}
                        
                        {/* Resource Suggestions */}
                        {isActive && node.resources && node.resources.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Suggested Resources</p>
                            {node.resources.map((res: any, i: number) => (
                              <div key={i} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-white border border-gray-100 rounded-lg p-2">
                                <FileText className="h-3 w-3 text-blue-500" />
                                {res.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
                </div>
              )}
            </div>

            {/* Bottom Area: AI Coach Chat */}
            <div className="flex-1 flex flex-col bg-[#f8f9fe] relative overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 pb-32" ref={scrollRef}>
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-[#6366f1]/10 text-[#6366f1] mb-5">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <h3 className="text-[20px] font-black text-gray-900">Your AI Mentor is Ready</h3>
                    <p className="mt-2 text-[14px] text-gray-500 leading-relaxed">
                      I've analyzed your profile and prepared the roadmap. Send a message to begin the first checkpoint!
                    </p>
                  </div>
                )}

                {messages.length > 0 && !heroDismissed && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[28px] bg-[#f2eefc] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#6366f1]/10 mb-6"
                  >
                    <button onClick={() => setHeroDismissed(true)}
                            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-xl bg-white/80 shadow-sm backdrop-blur">
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                    <div className="relative grid grid-cols-[minmax(0,1fr)_110px] gap-2">
                      <div className="pt-1">
                        <div className="text-sm font-medium text-[#6366f1]">👋 Let's do this!</div>
                        <h2 className="mt-1 text-2xl font-black leading-none text-gray-900">
                          I'm <span className="font-script text-[32px] text-[#6366f1]">Sana</span>
                        </h2>
                        <p className="mt-3 text-[13px] font-medium leading-snug text-gray-600">
                          Follow the roadmap steps and I'll guide you through the learning process! 🚀
                        </p>
                      </div>
                      <div className="relative">
                        <img src={sanaHero} alt="Sana"
                             className="absolute -right-6 -top-4 h-[150px] w-auto object-contain drop-shadow-xl" />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col gap-5">
                  {messages.map((m: any, idx: number) => {
                    const isLast = idx === messages.length - 1;
                    const fullText = m.parts?.map((p: any) => p.type === "text" ? p.text : "").join("") || m.content || "";
                    if (!fullText.trim() && m.role === "assistant" && status !== "streaming" && !isLast) return null;
                    if (m.role === "user" && fullText.includes("I'm ready for the next phase:")) return null; // Hide system triggers

                    const displayContent = fullText + (m.role === "assistant" && isLast && status === "streaming" ? "~~▋~~" : "");

                    return (
                      <div 
                        key={m.id}
                        className={cn(
                          "w-full transition-all animate-in slide-in-from-bottom-4 fade-in",
                          m.role === "user" 
                            ? "max-w-[85%] self-end rounded-2xl bg-[#5f5ce6] p-4 text-white shadow-md" 
                            : "self-center rounded-3xl bg-white p-6 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
                        )}
                      >
                        <SanaMarkdown content={displayContent} />
                      </div>
                    )
                  })}
                  
                  {isLoading && !messages.find((m: any) => m.role === "assistant" && (!m.parts || m.parts.length === 0)) && (
                    <div className="self-center text-[#5f5ce6] text-sm font-medium flex items-center justify-center gap-3 mt-2 p-6 rounded-3xl bg-white w-full border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] animate-pulse">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sana is analyzing...
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Input */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#f8f9fe] via-[#f8f9fe] to-transparent pt-10 pb-4 px-5">
                <form onSubmit={handleSubmit} className="relative flex items-center max-w-3xl mx-auto">
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask your mentor or answer the check..."
                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 pr-14 text-[15px] text-gray-900 shadow-sm focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!(input || '').trim() || isLoading}
                    className="absolute right-2 grid h-10 w-10 place-items-center rounded-xl bg-[#6366f1] text-white transition-transform active:scale-95 disabled:opacity-50 hover:bg-[#5f5ce6]"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* PHASE 4: COMPLETED */}
        {phase === 'completed' && (
          <motion.div key="completed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full" />
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 grid place-items-center shadow-2xl shadow-yellow-500/30 relative z-10 border-4 border-white">
                <Trophy className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h2 className="text-[32px] font-black text-gray-900 tracking-tight">Mission Completed!</h2>
            <p className="text-gray-500 mt-2 text-[15px] font-medium max-w-[280px]">
              You've successfully mastered {topicContext.title}. Your progress has been updated for your team.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Concept Mastery</p>
                <p className="text-[20px] font-black text-gray-900">100%</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">XP Earned</p>
                <p className="text-[20px] font-black text-orange-500">+320 XP</p>
              </div>
            </div>

            <button 
              onClick={() => onStartTeaching && onStartTeaching(topicContext.id || '', topicContext.title)}
              className="mt-8 flex items-center justify-center gap-2 bg-[#6366f1] text-white px-8 py-4 rounded-2xl font-bold text-[16px] shadow-lg shadow-[#6366f1]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Presentation className="h-5 w-5" />
              Prepare to Teach
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
