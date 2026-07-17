import { MessageCircle, FileText, Calendar, Compass, Sparkles, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type TabType = "chat" | "plan" | "resources" | "ai_workspace" | "dashboard" | "teaching_workspace" | "meeting";

interface BottomNavPillsProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

export function BottomNavPills({ activeTab, onChange }: BottomNavPillsProps) {
  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "ai_workspace", label: "My Study Space", icon: Brain },
    { id: "resources", label: "Resources", icon: Compass },
    { id: "plan", label: "Plan", icon: Calendar },
  ];

  const isChatActive = activeTab === "chat";

  return (
    <div className="absolute bottom-[90px] left-0 right-0 z-10 flex justify-center px-4 pointer-events-none">
      <div className="flex gap-2 rounded-[24px] bg-white/90 backdrop-blur-xl p-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 pointer-events-auto hide-scrollbar overflow-x-auto max-w-full ring-1 ring-black/5">
        {/* Group Chat chip */}
        <button
          onClick={() => onChange("chat")}
          className={cn(
            "flex items-center gap-1.5 rounded-[18px] px-4 py-2.5 text-[13px] font-bold transition-all whitespace-nowrap shrink-0",
            isChatActive
              ? "bg-[#6366f1] text-white shadow-[0_4px_12px_rgb(99,102,241,0.3)] scale-100"
              : "text-[#6366f1] bg-[#f3f0ff] hover:bg-[#e0e7ff] scale-[0.98] hover:scale-100"
          )}
        >
          <MessageCircle className="h-[18px] w-[18px] stroke-[2.5]" />
          <span>Group Chat</span>
        </button>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-[18px] px-4 py-2.5 text-[13px] font-bold transition-all duration-300 whitespace-nowrap shrink-0",
                isActive 
                  ? "bg-[#6366f1] text-white shadow-[0_4px_12px_rgb(99,102,241,0.3)] scale-100" 
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 scale-[0.98] hover:scale-100"
              )}
            >
              <tab.icon className="h-[18px] w-[18px] stroke-[2.5]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

