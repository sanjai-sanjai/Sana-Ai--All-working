import { useState, useEffect } from "react";
import { 
  Presentation, Mic, HelpCircle, CheckSquare, 
  ArrowRight, ArrowLeft, Loader2, StopCircle, Award 
} from "lucide-react";
import { SanaMarkdown } from "@/components/sana-markdown";
import { supabase } from "@/integrations/supabase/client";

interface TeachingWorkspaceProps {
  topicId: string;
  topicTitle: string;
  groupId: string;
  teacherId: string;
  onExit: () => void;
}

export function TeachingWorkspace({ topicId, topicTitle, groupId, teacherId, onExit }: TeachingWorkspaceProps) {
  const [material, setMaterial] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  
  // Checklist State
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Explain core concept", done: false },
    { id: 2, text: "Give a real-world analogy", done: false },
    { id: 3, text: "Show an example/diagram", done: false },
    { id: 4, text: "Ask teammates a question", done: false },
    { id: 5, text: "Answer their doubts", done: false },
    { id: 6, text: "Summarize briefly", done: false },
  ]);

  useEffect(() => {
    const initTeaching = async () => {
      setIsLoading(true);
      // 1. Fetch or Generate Materials
      const { data: existing } = await (supabase as any).from("teaching_materials")
        .select("*").eq("topic_id", topicId).eq("teacher_id", teacherId).single();

      let matData = existing?.structured_content;
      if (!existing) {
        const res = await fetch("/api/teach-prep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId, teacherId, groupId })
        });
        matData = await res.json();
      }
      setMaterial(matData);

      // 2. Start Teaching Session
      const { data: session } = await (supabase as any).from("teaching_sessions").insert({
        group_id: groupId,
        topic_id: topicId,
        teacher_id: teacherId,
        material_id: matData?.materialId || existing?.id,
        status: "active"
      }).select().single();
      
      setSessionId(session?.id);
      
      // 3. Broadcast to timeline
      await (supabase as any).from("group_timeline").insert({
        group_id: groupId,
        user_id: teacherId,
        action: `started teaching ${topicTitle}`
      });

      setIsLoading(false);
    };

    initTeaching();
  }, [topicId, teacherId, groupId, topicTitle]);

  const endSession = async () => {
    if (!sessionId) return;
    setIsEnding(true);
    await (supabase as any).from("teaching_sessions").update({
      status: "completed",
      ended_at: new Date().toISOString()
    }).eq("id", sessionId);

    await (supabase as any).from("group_timeline").insert({
      group_id: groupId,
      user_id: teacherId,
      action: `finished teaching ${topicTitle}`
    });
    
    setIsEnding(false);
    onExit();
  };

  const toggleChecklist = (id: number) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  if (isLoading || !material) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#1e1b4b] text-white p-8 text-center rounded-[32px] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4338ca]/30 to-transparent pointer-events-none" />
        <Loader2 className="h-12 w-12 animate-spin text-indigo-400 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Preparing Your Presentation...</h2>
        <p className="text-indigo-200">The AI is building slides, whiteboard diagrams, and your speaker notes.</p>
      </div>
    );
  }

  const slides = material.presentation || [];
  const currentSlideData = slides[currentSlide];
  const currentSpeakerNote = material.speakerNotes?.find((n: any) => n.slideNumber === currentSlideData?.slideNumber);

  return (
    <div className="flex h-full w-full bg-[#f8f9fe] rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-border/50 flex-col md:flex-row">
      
      {/* Left Column: Presentation Stage */}
      <div className="flex-1 flex flex-col bg-[#1e1b4b] text-white relative">
        {/* Stage Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300">
              <Presentation className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[12px] text-indigo-300 font-medium uppercase tracking-widest">Live Presentation</p>
              <h2 className="text-[16px] font-bold">{topicTitle}</h2>
            </div>
          </div>
          <button 
            onClick={endSession}
            disabled={isEnding}
            className="flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-4 py-2 rounded-full text-sm font-bold transition-colors"
          >
            {isEnding ? <Loader2 className="h-4 w-4 animate-spin" /> : <StopCircle className="h-4 w-4" />}
            End Class
          </button>
        </div>

        {/* Slide Content */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col justify-center">
          {currentSlideData ? (
            <div className="bg-white/5 rounded-3xl p-8 backdrop-blur-sm border border-white/10 prose prose-invert max-w-none">
              <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white">
                {currentSlideData.title}
              </h1>
              <div className="text-lg leading-relaxed text-indigo-50/90">
                <SanaMarkdown content={currentSlideData.content} />
              </div>
            </div>
          ) : null}

          {/* Whiteboard Inject (Show on middle slide maybe? Or if specific slide title matches) */}
          {currentSlide === Math.floor(slides.length / 2) && material.whiteboard && (
            <div className="mt-6 bg-white/5 rounded-3xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-indigo-200 font-bold mb-4 flex items-center gap-2"><Mic className="h-4 w-4"/> AI Whiteboard Diagram</h3>
              <div className="bg-white rounded-xl p-4 overflow-x-auto text-black">
                <pre className="mermaid">{material.whiteboard}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Slide Controls */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <button 
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-medium text-indigo-200">Slide {currentSlide + 1} of {slides.length}</span>
          <button 
            onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Right Column: Instructor Dashboard */}
      <div className="w-full md:w-[380px] bg-white border-l border-gray-100 flex flex-col h-full overflow-y-auto">
        
        {/* Speaker Notes */}
        <div className="p-6 border-b border-gray-100 bg-yellow-50/30">
          <h3 className="text-[14px] font-bold text-yellow-700 flex items-center gap-2 mb-3 uppercase tracking-wider">
            <Mic className="h-4 w-4" />
            Speaker Notes
          </h3>
          <p className="text-[15px] text-gray-800 leading-relaxed font-medium">
            {currentSpeakerNote?.note || "Introduce the slide concepts clearly in your own words."}
          </p>
        </div>

        {/* Expected Questions */}
        <div className="p-6 border-b border-gray-100 bg-[#f8f9fe]">
          <h3 className="text-[14px] font-bold text-[#6366f1] flex items-center gap-2 mb-4 uppercase tracking-wider">
            <HelpCircle className="h-4 w-4" />
            Expected Questions
          </h3>
          <div className="space-y-4">
            {material.expectedQuestions?.map((q: any, i: number) => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-[14px] font-bold text-gray-900 mb-2">Q: {q.question}</p>
                <p className="text-[13px] text-gray-600 leading-snug">A: {q.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Teaching Checklist */}
        <div className="p-6">
          <h3 className="text-[14px] font-bold text-emerald-600 flex items-center gap-2 mb-4 uppercase tracking-wider">
            <CheckSquare className="h-4 w-4" />
            Teaching Checklist
          </h3>
          <div className="space-y-3">
            {checklist.map(item => (
              <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-colors ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'}`}>
                  {item.done && <CheckSquare className="h-4 w-4 text-white" />}
                </div>
                <span className={`text-[14px] font-medium transition-colors ${item.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
