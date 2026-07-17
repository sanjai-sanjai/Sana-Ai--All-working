import { useState } from "react";
import { cn } from "@/lib/utils";
import { Bot, Map, FolderOpen, LineChart, CheckCircle2, Circle, Edit2, Plus, PenTool, Upload, Bell, Mic, Timer } from "lucide-react";
import { motion } from "framer-motion";

const TAB_OPTIONS = [
  { id: "ai_study", label: "AI Study", icon: Bot },
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "resources", label: "Resources", icon: FolderOpen },
  { id: "insights", label: "Insights", icon: LineChart },
];

export function StudyTogetherRightSidebar() {
  const [activeTab, setActiveTab] = useState("ai_study");

  return (
    <div className="hidden md:flex flex-col w-[380px] lg:w-[420px] bg-[#f8f9fa] border-l border-gray-200/60 overflow-y-auto hide-scrollbar pb-10">
      {/* Top Nav Tabs */}
      <div className="sticky top-0 z-10 bg-[#f8f9fa]/90 backdrop-blur-md pt-5 px-6 border-b border-gray-200/50">
        <div className="flex items-center justify-between gap-1 pb-4">
          {TAB_OPTIONS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-1.5 flex-1 relative group"
              >
                <div className={cn(
                  "grid h-[38px] w-[38px] place-items-center rounded-xl transition-all duration-300",
                  isActive ? "bg-[#f3f0ff] text-[#6366f1]" : "bg-transparent text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-900"
                )}>
                  <tab.icon className={cn("h-[18px] w-[18px] stroke-[2.5]", isActive && "fill-[#f3f0ff]")} />
                </div>
                <span className={cn(
                  "text-[11.5px] font-bold transition-colors",
                  isActive ? "text-[#6366f1]" : "text-gray-500 group-hover:text-gray-900"
                )}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div layoutId="activeTabIndicator" className="absolute -bottom-[17px] w-full h-[3px] rounded-t-full bg-[#6366f1]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto hide-scrollbar">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          {activeTab === "ai_study" && (
            <>
              {/* Study Together with AI Banner */}
              <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#6366f1] to-[#4f46e5] p-6 shadow-[0_8px_30px_rgb(99,102,241,0.25)] text-white">
                <div className="relative z-10 w-[75%]">
                  <h3 className="text-[16px] font-bold flex items-center gap-2 mb-2.5">
                    <span className="text-xl">✨</span> AI Study Coach
                  </h3>
                  <p className="text-[13px] font-medium text-indigo-50 leading-snug">
                    Mention <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded text-white">@Sana_AI</span> in the chat to ask doubts, get explanations and create study plans.
                  </p>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] w-[120px] h-[120px] rounded-full bg-white/10 blur-2xl" />
                <div className="absolute right-3 bottom-2 text-[70px] drop-shadow-2xl">🤖</div>
              </div>
              
              <p className="text-[12px] font-medium text-gray-500 text-center flex items-center justify-center gap-2">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">i</span>
                AI responds only when you mention @Sana_AI
              </p>

              {/* Topic Assignments */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="flex items-center gap-2 text-[16px] font-bold text-gray-900 tracking-[-0.01em]">
                    <Bot className="h-5 w-5 text-[#6366f1] stroke-[2]" />
                    Topic Assignments
                  </h3>
                  <button className="text-[13px] font-bold text-[#6366f1] hover:underline">Edit</button>
                </div>

                <div className="space-y-3 mb-5">
                  {[
                    { name: "Sanjai", role: "(You)", tag: "Trees", color: "bg-[#ecfdf5] text-[#10b981] border-[#d1fae5]", letter: "S" },
                    { name: "Hari", role: "", tag: "Graphs", color: "bg-[#f3f0ff] text-[#6366f1] border-[#e0e7ff]", letter: "H" },
                    { name: "Akash", role: "", tag: "Sorting", color: "bg-[#fff7ed] text-[#f97316] border-[#ffedd5]", letter: "A" },
                    { name: "Naveen", role: "", tag: "Searching", color: "bg-[#fef2f2] text-[#ef4444] border-[#fee2e2]", letter: "N" }
                  ].map((user) => (
                    <div key={user.name} className="flex items-center justify-between p-3 rounded-[16px] bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 grid place-items-center text-gray-700 font-bold text-[14px] shadow-inner">
                          {user.letter}
                        </div>
                        <span className="text-[14.5px] font-bold text-gray-900">
                          {user.name} {user.role && <span className="text-gray-400 font-semibold">{user.role}</span>}
                        </span>
                      </div>
                      <span className={cn("px-3 py-1 rounded-full text-[12px] font-bold border", user.color)}>
                        {user.tag}
                      </span>
                    </div>
                  ))}
                </div>

                <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[16px] border-2 border-dashed border-[#e0e7ff] text-[#6366f1] bg-[#f8f9fe] hover:bg-[#f3f0ff] hover:border-[#6366f1]/30 transition-all font-bold text-[13.5px]">
                  <Edit2 className="h-4 w-4" />
                  Edit Strengths & Weaknesses
                </button>
              </section>
            </>
          )}

          {activeTab === "roadmap" && (
            <>
              {/* Current Roadmap */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="flex items-center gap-2 text-[16px] font-bold text-gray-900 tracking-[-0.01em]">
                    <Map className="h-5 w-5 text-[#6366f1] stroke-[2]" />
                    Current Roadmap
                  </h3>
                  <button className="text-[13px] font-bold text-[#6366f1] hover:underline">View Full</button>
                </div>
                
                <div className="relative pl-3.5 space-y-7 before:absolute before:inset-y-2 before:left-[21px] before:w-px before:bg-gray-200">
                  {/* Step 1 */}
                  <div className="relative flex items-start gap-4">
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#6366f1] text-white text-[12px] font-bold shadow-[0_0_0_4px_#f8f9fa] z-10">1</div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[15px] font-bold text-gray-900 leading-tight">Foundations</h4>
                        <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-bold text-[#10b981] border border-[#d1fae5]">Completed</span>
                      </div>
                      <p className="text-[13px] font-medium text-gray-500 mt-1">Arrays, Linked List, Stack, Queue</p>
                    </div>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="relative flex items-start gap-4">
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f3f0ff] text-[#6366f1] border-2 border-white text-[12px] font-bold shadow-[0_0_0_4px_#f8f9fa] ring-1 ring-[#e0e7ff] z-10">2</div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[15px] font-bold text-gray-900 leading-tight">Trees</h4>
                        <span className="rounded-full bg-[#f3f0ff] px-2 py-0.5 text-[10px] font-bold text-[#6366f1] border border-[#e0e7ff]">In Progress</span>
                      </div>
                      <p className="text-[13px] font-medium text-gray-500 mt-1">Binary Trees, BST, Traversals</p>
                    </div>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="relative flex items-start gap-4">
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-gray-400 border border-gray-200 text-[12px] font-bold shadow-[0_0_0_4px_#f8f9fa] z-10">3</div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[15px] font-bold text-gray-400 leading-tight">Graphs</h4>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-gray-400 border border-gray-200">Pending</span>
                      </div>
                      <p className="text-[13px] font-medium text-gray-400/80 mt-1">BFS, DFS, Representations</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative flex items-start gap-4">
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-gray-400 border border-gray-200 text-[12px] font-bold shadow-[0_0_0_4px_#f8f9fa] z-10">4</div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[15px] font-bold text-gray-400 leading-tight">Advanced Topics</h4>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-gray-400 border border-gray-200">Pending</span>
                      </div>
                      <p className="text-[13px] font-medium text-gray-400/80 mt-1">Heap, Hashing, Tries, DP on DS</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Team Actions */}
              <section className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2 text-[16px] font-bold text-gray-900 tracking-[-0.01em]">
                    <span className="flex">👥</span>
                    Team Actions
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: CheckCircle2, label: "Start Poll", color: "text-emerald-500", bg: "bg-emerald-50" },
                    { icon: PenTool, label: "Create Note", color: "text-blue-500", bg: "bg-blue-50" },
                    { icon: Timer, label: "Study Timer", color: "text-cyan-500", bg: "bg-cyan-50" },
                  ].map((action, i) => (
                    <button key={i} className="flex flex-col items-center justify-center gap-2.5 bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-gray-100/80 hover:shadow-md hover:border-gray-200 transition-all active:scale-95">
                      <div className={cn("grid h-10 w-10 place-items-center rounded-[14px]", action.bg, action.color)}>
                        <action.icon className="h-[22px] w-[22px]" />
                      </div>
                      <span className="text-[12px] font-bold text-gray-700 leading-tight text-center">{action.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === "resources" && (
            <>
              {/* Shared Resources */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="flex items-center gap-2 text-[16px] font-bold text-gray-900 tracking-[-0.01em]">
                    <FolderOpen className="h-5 w-5 text-[#6366f1] stroke-[2]" />
                    Shared Resources
                  </h3>
                  <button className="text-[13px] font-bold text-[#6366f1] hover:underline">View All</button>
                </div>

                <div className="space-y-3 mb-5">
                  {/* Resource 1 */}
                  <div className="flex items-center gap-3 p-3 rounded-[16px] bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group hover:border-red-200 transition-colors cursor-pointer">
                    <div className="h-12 w-12 shrink-0 rounded-[14px] bg-red-50 text-red-500 grid place-items-center group-hover:bg-red-100 transition-colors">
                      <span className="font-bold text-[12px]">PDF</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-bold text-gray-900 truncate">Binary Trees – Full Notes.pdf</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[12.5px] font-semibold text-gray-500">2.1 MB • Sanjai</span>
                        <span className="text-[12px] font-semibold text-gray-400">Today</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Resource 2 */}
                  <div className="flex items-center gap-3 p-3 rounded-[16px] bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group hover:border-blue-200 transition-colors cursor-pointer">
                    <div className="h-12 w-12 shrink-0 rounded-[14px] bg-blue-50 text-blue-500 grid place-items-center group-hover:bg-blue-100 transition-colors">
                      <span className="font-bold text-[12px]">DOC</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-bold text-gray-900 truncate">DFS vs BFS Explanation.docx</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[12.5px] font-semibold text-gray-500">1.3 MB • Akash</span>
                        <span className="text-[12px] font-semibold text-gray-400">Today</span>
                      </div>
                    </div>
                  </div>

                  {/* Resource 3 */}
                  <div className="flex items-center gap-3 p-3 rounded-[16px] bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group hover:border-orange-200 transition-colors cursor-pointer">
                    <div className="h-12 w-12 shrink-0 rounded-[14px] bg-orange-50 text-orange-500 grid place-items-center group-hover:bg-orange-100 transition-colors">
                      <span className="font-bold text-[12px]">{"</>"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-bold text-gray-900 truncate">Tree Traversal Code (C++).cpp</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[12.5px] font-semibold text-gray-500">4.8 KB • Hari</span>
                        <span className="text-[12px] font-semibold text-gray-400">Yesterday</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Resource 4 */}
                  <div className="flex items-center gap-3 p-3 rounded-[16px] bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group hover:border-emerald-200 transition-colors cursor-pointer">
                    <div className="h-12 w-12 shrink-0 rounded-[14px] bg-emerald-50 text-emerald-500 grid place-items-center group-hover:bg-emerald-100 transition-colors">
                      <span className="font-bold text-[12px]">IMG</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-bold text-gray-900 truncate">Binary Tree Diagram.png</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[12.5px] font-semibold text-gray-500">220 KB • Naveen</span>
                        <span className="text-[12px] font-semibold text-gray-400">Yesterday</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button className="flex flex-col items-center justify-center gap-2 bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-gray-100/80 hover:shadow-md hover:border-gray-200 transition-all active:scale-95">
                    <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-indigo-50 text-[#6366f1]">
                      <Upload className="h-[22px] w-[22px]" />
                    </div>
                    <span className="text-[12px] font-bold text-gray-700 leading-tight text-center">Upload File</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-2 bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-gray-100/80 hover:shadow-md hover:border-gray-200 transition-all active:scale-95">
                    <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-rose-50 text-rose-500">
                      <Mic className="h-[22px] w-[22px]" />
                    </div>
                    <span className="text-[12px] font-bold text-gray-700 leading-tight text-center">Voice Note</span>
                  </button>
                </div>

                <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[16px] border border-gray-200/60 text-[#6366f1] bg-white shadow-sm hover:shadow-md hover:border-[#6366f1]/30 transition-all font-bold text-[13.5px]">
                  <Plus className="h-4 w-4 stroke-[3]" />
                  Add New Resource
                </button>
              </section>
            </>
          )}

          {activeTab === "insights" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-[#f8f9fe] shadow-inner border border-[#e0e7ff]">
                <LineChart className="h-10 w-10 text-[#6366f1]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Team Insights</h3>
              <p className="mt-2.5 max-w-[240px] text-[13.5px] font-medium text-gray-500 leading-relaxed">
                Analytics and progress metrics for your study group will appear here soon.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
