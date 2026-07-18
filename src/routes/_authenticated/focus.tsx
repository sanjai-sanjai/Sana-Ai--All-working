import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ArrowRight, Share2, Flame, Target, Zap, Clock, 
  BrainCircuit, ShieldCheck, BatteryCharging, Trophy,
  Play, Bot, ChevronRight, Lock, BookOpen, Star, Sparkles
} from "lucide-react";
import { ProgressRing } from "@/components/app/ProgressRing";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, addDays, isSameDay } from "date-fns";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/focus")({
  component: FocusDashboard,
});

function FocusDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [score, setScore] = useState(92);
  const [streak, setStreak] = useState(28);
  const [xp, setXp] = useState(320);
  const [level, setLevel] = useState(8);
  const [todayScoreDiff, setTodayScoreDiff] = useState(8);

  // Mock data for UI presentation according to the screenshot
  const metrics = [
    { label: "Deep Focus", value: 96, status: "Excellent", color: "bg-[#6366f1]", icon: Target },
    { label: "Consistency", value: 91, status: "Excellent", color: "bg-[#22c55e]", icon: ShieldCheck },
    { label: "Productivity", value: 89, status: "Great", color: "bg-[#f97316]", icon: Zap },
    { label: "Learning Quality", value: 94, status: "Excellent", color: "bg-[#3b82f6]", icon: BookOpen },
    { label: "Distraction Control", value: 82, status: "Good", color: "bg-[#ec4899]", icon: ShieldCheck },
    { label: "Energy Level", value: 90, status: "Great", color: "bg-[#eab308]", icon: BatteryCharging },
  ];

  const timeline = [
    { time: "8:00 AM", title: "Deep Study Session", progress: 100, color: "bg-emerald-500" },
    { time: "9:30 AM", title: "Reading & Notes", progress: 65, color: "bg-yellow-400", alert: "Notification distraction" },
    { time: "11:00 AM", title: "Problem Solving", progress: 95, color: "bg-emerald-500" },
    { time: "2:00 PM", title: "Revision", progress: 82, color: "bg-emerald-500" },
    { time: "4:30 PM", title: "Practice Quiz", progress: 90, color: "bg-purple-500" },
  ];

  const weeklyTrendData = [
    { day: "Mon", score: 81 },
    { day: "Tue", score: 84 },
    { day: "Wed", score: 86 },
    { day: "Thu", score: 90 },
    { day: "Fri", score: 92 },
    { day: "Sat", score: 95 },
    { day: "Sun", score: 89 },
  ];

  // For heatmap, generating 4 weeks of data
  const generateHeatmap = () => {
    return Array.from({ length: 4 }).map((_, w) => 
      Array.from({ length: 7 }).map((_, d) => {
        const val = Math.random();
        return val > 0.7 ? 3 : val > 0.4 ? 2 : val > 0.1 ? 1 : 0; // 0=none, 1=low, 2=med, 3=high
      })
    );
  };
  const [heatmap] = useState(generateHeatmap());

  const getHeatmapColor = (level: number) => {
    switch(level) {
      case 3: return "bg-[#22c55e]";
      case 2: return "bg-[#4ade80]";
      case 1: return "bg-[#bbf7d0]";
      default: return "bg-gray-100";
    }
  };

  useEffect(() => {
    // Play confetti on mount if score is higher
    if (todayScoreDiff > 0) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6366f1', '#a855f7', '#ec4899']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#6366f1', '#a855f7', '#ec4899']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
    
    // DB subscription would go here
  }, [todayScoreDiff]);

  return (
    <div className="flex h-full flex-col bg-[#f8f9fe] overflow-hidden">
      {/* Topbar */}
      <div className="flex shrink-0 items-center justify-between bg-white/80 px-4 py-3 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate({ to: "/" })}
            className="grid h-10 w-10 place-items-center rounded-full bg-gray-100/80 transition-colors hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-900" />
          </button>
          <div>
            <h1 className="text-[18px] font-black leading-tight text-gray-900 tracking-tight">Focus Score</h1>
            <p className="text-[11px] font-medium text-gray-500">AI-Powered Productivity Coach</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 border border-orange-100">
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
            <div className="flex flex-col leading-none">
              <span className="text-[13px] font-black text-orange-600">{streak}</span>
              <span className="text-[8px] font-bold uppercase text-orange-400">Day Streak</span>
            </div>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-full bg-gray-100/80 transition-colors hover:bg-gray-200">
            <Share2 className="h-4 w-4 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar px-4 pt-4">
        
        {/* HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#9333ea] p-6 shadow-xl shadow-indigo-500/20"
        >
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl" />
          
          <div className="relative flex flex-col gap-6 items-center text-center">
            
            {/* Score Ring & Avatar */}
            <div className="shrink-0 flex items-center justify-center relative w-[130px] h-[130px] mx-auto">
              {/* Duolingo style mascot representation via an icon or emoji for now */}
              <div className="absolute -bottom-4 z-10 bg-[#22c55e] text-white p-2 rounded-2xl border-4 border-[#7c3aed] shadow-lg transform rotate-[-5deg]">
                <div className="text-2xl font-sans font-black flex items-center gap-1"><Sparkles className="h-4 w-4 fill-white"/></div>
              </div>
              
              <ProgressRing 
                value={score} 
                size={130} 
                stroke={10} 
                color="#22c55e"
                trackColor="rgba(255,255,255,0.2)"
                label={`${score}%`}
                labelClassName="text-white text-[32px] font-black tracking-tighter"
              />
              <div className="absolute -bottom-8 w-full text-center">
                <span className="text-[12px] font-bold text-white/90 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  Excellent Focus!
                </span>
              </div>
            </div>

            <div className="flex-1 mt-2 z-10">
              <h2 className="text-[24px] font-black text-white leading-tight">Outstanding work, {user?.user_metadata?.display_name?.split(' ')[0] || "Sanjai"}! 🎉</h2>
              <p className="mt-2 text-[14px] font-medium text-white/80 leading-relaxed max-w-sm mx-auto">
                You're in the top <span className="font-bold text-white">12%</span> of focused learners today. Consistency is your superpower!
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 bg-black/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Score increase</p>
                  <p className="text-[22px] font-black text-[#4ade80]">+{todayScoreDiff}</p>
                  <p className="text-[11px] text-white/70">from yesterday</p>
                </div>
                <div className="border-l border-white/10 pl-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Better than</p>
                  <p className="text-[22px] font-black text-white">87%</p>
                  <p className="text-[11px] text-white/70">of your past sessions</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* METRICS GRID */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {metrics.map((m, i) => (
            <motion.div 
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center"
            >
              <div className={`h-8 w-8 rounded-full ${m.color}/10 grid place-items-center mb-2`}>
                <m.icon className={`h-4 w-4 text-${m.color.replace('bg-', '')}`} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 leading-tight h-6 mb-1">{m.label}</p>
              <p className="text-[22px] font-black text-gray-900 leading-none mb-2">{m.value}</p>
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.value}%` }} />
              </div>
              <p className="text-[10px] font-bold text-gray-500">{m.status}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6">
          {/* FOCUS TIMELINE */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-bold text-gray-900">Focus Timeline</h3>
              <button className="text-[12px] font-bold text-[#6366f1]">View all</button>
            </div>
            
            <div className="space-y-4">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-16 shrink-0 text-right pt-0.5">
                    <span className="text-[11px] font-bold text-gray-400">{item.time}</span>
                  </div>
                  <div className="relative flex-1 pb-4">
                    {/* Vertical line */}
                    {i !== timeline.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-px bg-gray-100" />
                    )}
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`h-4 w-4 rounded-full border-4 border-white ${item.color} shadow-sm`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-bold text-gray-900">{item.title}</span>
                          <span className="text-[11px] font-bold text-gray-500">{item.progress}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.progress}%` }} />
                        </div>
                        {item.alert && (
                          <p className="mt-1 text-[11px] font-bold text-orange-500">{item.alert}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-[#6366f1]/5 rounded-2xl p-4 flex items-center gap-3 border border-[#6366f1]/10">
              <div className="h-10 w-10 rounded-full bg-[#6366f1]/20 grid place-items-center shrink-0">
                <Star className="h-5 w-5 text-[#6366f1] fill-[#6366f1]" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-600">Your most productive time is</p>
                <p className="text-[14px] font-black text-[#6366f1]">8:00 AM - 11:00 AM</p>
              </div>
            </div>
          </div>

          {/* WEEKLY TREND & HEATMAP */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-gray-900">Weekly Trend</h3>
              <select className="text-[12px] font-bold text-[#6366f1] bg-transparent outline-none">
                <option>This week</option>
                <option>Last week</option>
              </select>
            </div>
            
            <div className="h-[140px] w-full mb-6 relative left-[-10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrendData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#111827', fontWeight: 800 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
              {/* Overlay labels since Recharts doesn't look exactly like the screenshot without heavy config */}
              <div className="absolute inset-0 flex justify-between px-2 pt-2 pointer-events-none">
                {weeklyTrendData.map((d, i) => (
                  <div key={d.day} className="flex flex-col items-center justify-between h-full">
                    <span className={cn("text-[11px] font-bold", d.score >= 95 ? "text-emerald-500" : "text-gray-900")}>
                      {d.score}
                    </span>
                    <span className={cn("text-[10px] font-medium pb-2", d.day === 'Fri' ? "bg-[#8b5cf6] text-white px-2 py-0.5 rounded-full" : "text-gray-400")}>
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <h4 className="text-[14px] font-bold text-gray-900 mb-4">Focus Heatmap</h4>
            <div className="flex gap-2">
              <div className="flex flex-col justify-between py-1 shrink-0">
                <span className="text-[9px] font-bold text-gray-400 h-4">Week 1</span>
                <span className="text-[9px] font-bold text-gray-400 h-4">Week 2</span>
                <span className="text-[9px] font-bold text-gray-400 h-4">Week 3</span>
                <span className="text-[9px] font-bold text-gray-400 h-4">Week 4</span>
              </div>
              <div className="flex-1 flex justify-between">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, colIdx) => (
                  <div key={day} className="flex flex-col gap-1 items-center">
                    <span className="text-[10px] font-bold text-gray-400 mb-1">{day}</span>
                    {heatmap.map((row, rowIdx) => (
                      <div 
                        key={rowIdx} 
                        className={`h-4 w-4 rounded-sm ${getHeatmapColor(row[colIdx])}`} 
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#22c55e]" /><span className="text-[10px] font-bold text-gray-500">High Focus</span></div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#facc15]" /><span className="text-[10px] font-bold text-gray-500">Medium Focus</span></div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-gray-200" /><span className="text-[10px] font-bold text-gray-500">Low Focus</span></div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6">
          {/* TODAY'S WINS */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              Today's Wins 🏆
            </h3>
            
            <div className="space-y-1">
              {[
                { text: "Completed 3 Pomodoro sessions", icon: "🍅" },
                { text: "Studied for 3h 42m", icon: "🕒" },
                { text: "No skipped pomodoros", icon: "✅" },
                { text: "Completed Python roadmap", icon: "💻" },
                { text: "Reviewed notes", icon: "📖" },
              ].map((win, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{win.icon}</span>
                    <span className="text-[13px] font-medium text-gray-700">{win.text}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#6366f1]" />
                </div>
              ))}
            </div>

            <div className="mt-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-4">
              <div className="text-4xl">🐸</div>
              <div>
                <p className="text-[13px] font-black text-emerald-800">Amazing day!</p>
                <p className="text-[11px] font-medium text-emerald-600 mt-0.5">You're building a strong habit 💪</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* AI COACH */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-bold text-gray-900">AI Coach Says</h3>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 bg-[#6366f1]/5 p-4 rounded-2xl rounded-tr-sm border border-[#6366f1]/10 relative">
                  <p className="text-[13px] font-medium text-gray-700 leading-relaxed">
                    You switched apps 4 times today. Reducing context switching could <span className="font-bold text-gray-900">increase your Focus Score to 96+!</span>
                  </p>
                  <div className="absolute top-4 -right-2 w-4 h-4 bg-[#6366f1]/5 border-t border-r border-[#6366f1]/10 transform rotate-45" />
                </div>
                <div className="shrink-0 w-24 flex items-center justify-center pt-4">
                  {/* Robot emoji placeholder for the 3D illustration in screenshot */}
                  <div className="text-6xl filter drop-shadow-lg">🤖</div>
                </div>
              </div>

              <button className="w-full mt-5 bg-[#7c3aed] text-white py-3.5 rounded-xl font-bold text-[14px] shadow-lg shadow-[#7c3aed]/20 transition-transform active:scale-[0.98] hover:bg-[#6d28d9] flex justify-center items-center gap-2">
                View Personalized Tips <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* PREDICTION */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-[14px] font-bold text-gray-900 mb-4">Tomorrow's Focus Prediction</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 grid place-items-center text-emerald-500">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[32px] font-black text-gray-900 leading-none block">95</span>
                    <span className="text-[11px] font-bold text-gray-500">Great day ahead!</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌙</span>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Recommended Sleep</p>
                      <p className="text-[13px] font-black text-gray-900">7h 45m</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📖</span>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Recommended Study</p>
                      <p className="text-[13px] font-black text-gray-900">3h 20m</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PROGRESS CARD */}
        <div className="mt-6 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center gap-6 mb-6">
          <div className="flex-1 w-full">
            <h3 className="text-[14px] font-bold text-gray-900 mb-4">Level Progress</h3>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-[#7c3aed] grid place-items-center relative shrink-0 shadow-lg shadow-[#7c3aed]/30">
                <div className="absolute inset-1 rounded-xl border border-white/20" />
                <span className="text-[24px] font-black text-white">{level}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">Level {level}</p>
                    <p className="text-[11px] font-medium text-gray-500">Focus Master</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-medium text-gray-500">{180} XP to<br/>Level {level + 1}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#7c3aed] rounded-full w-[70%]" />
                  </div>
                  <span className="text-2xl">📦</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 mt-1">420 / 600 XP</p>
              </div>
            </div>
          </div>
          
          <div className="w-full bg-orange-50 rounded-2xl p-4 border border-orange-100 text-center flex flex-col items-center justify-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 mb-2 flex items-center gap-1 justify-center">
              Today's XP 🎊
            </p>
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-orange-500 fill-orange-500" />
              <span className="text-[32px] font-black text-gray-900">+{xp}</span>
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM CTA */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-12 pb-16 px-4 z-20 pointer-events-none">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-between bg-[#1e1b4b] p-4 rounded-[24px] shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">🐸</div>
            <div>
              <p className="text-[16px] font-bold text-white">Keep going, champion! 🚀</p>
              <p className="text-[12px] font-medium text-indigo-200 mt-0.5">Small steps today, giant leaps tomorrow.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate({ to: "/" })}
            className="w-full bg-white text-[#1e1b4b] px-6 py-3.5 rounded-xl font-bold text-[14px] transition-transform active:scale-[0.98] hover:bg-gray-50 flex justify-center items-center gap-2"
          >
            Start Next Session <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
