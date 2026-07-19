import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamMember {
  id: string;
  name: string;
  avatar_url?: string | null;
  progress_pct: number;
  is_online: boolean;
  is_you?: boolean;
  role?: string;
}

interface TeamProgressOverviewProps {
  members: TeamMember[];
  onViewAll: () => void;
}

export function TeamProgressOverview({ members, onViewAll }: TeamProgressOverviewProps) {
  const colors = [
    { text: "text-[#6366f1]", bg: "bg-[#6366f1]" }, // Purple/Indigo
    { text: "text-[#f59e0b]", bg: "bg-[#f59e0b]" }, // Orange
    { text: "text-[#10b981]", bg: "bg-[#10b981]" }, // Green
    { text: "text-[#ef4444]", bg: "bg-[#ef4444]" }, // Red
  ];

  const avgProgress = members.length > 0 
    ? Math.round(members.reduce((acc, m) => acc + (m.progress_pct || 0), 0) / members.length)
    : 0;
  const completedCount = members.filter(m => (m.progress_pct || 0) >= 100).length;

  return (
    <div className="mx-4 mt-6 mb-2 rounded-[28px] bg-white pt-6 pb-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/50">
      <div className="flex items-center justify-between px-6 mb-6">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="h-[22px] w-[22px] text-[#6366f1] stroke-[2.5]" />
          <h3 className="text-[17px] font-bold text-gray-900 tracking-[-0.01em]">Team Progress Overview</h3>
        </div>
        <button 
          onClick={onViewAll}
          className="text-[14px] font-bold text-[#6366f1] hover:text-[#5A48F9] transition-colors"
        >
          View All
        </button>
      </div>

      <div className="hide-scrollbar flex gap-5 overflow-x-auto px-6 pb-2">
        {members.map((member, index) => {
          const color = colors[index % colors.length];
          return (
            <div key={member.id} className="flex min-w-[96px] flex-col items-center bg-[#fdfdfd] border border-gray-50 rounded-2xl pt-4 pb-4 px-2 shadow-[0_2px_12px_rgba(0,0,0,0.02)] shrink-0">
              <div className="relative mb-3">
                <div className="h-[64px] w-[64px] overflow-hidden rounded-full bg-gray-50 shadow-[0_4px_14px_rgba(0,0,0,0.06)] border-[2.5px] border-white ring-1 ring-gray-100/50">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[#f8f9fa] text-[#6366f1] text-[20px] font-bold">
                      {member.name.substring(0, 1)}
                    </div>
                  )}
                </div>
                {/* Online Indicator */}
                {member.is_online && (
                  <div className="absolute bottom-0.5 right-0.5 h-[16px] w-[16px] rounded-full border-[3px] border-white bg-[#10b981] shadow-sm" />
                )}
              </div>
              
              <div className="text-center mb-1.5 flex flex-col items-center">
                <p className="text-[14px] font-bold text-gray-900 truncate max-w-[80px] tracking-[-0.01em]">
                  {member.name}
                </p>
                <p className="text-[11.5px] font-semibold text-gray-400 mt-0.5">
                  {member.is_you ? "You" : (member.role === 'owner' ? 'Owner' : 'Member')}
                </p>
              </div>

              <p className={cn("mt-0.5 text-[18px] font-bold tracking-tight", color.text)}>
                {member.progress_pct}%
              </p>

              <div className="mt-2 h-[5px] w-[60px] overflow-hidden rounded-full bg-gray-100">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", color.bg)}
                  style={{ width: `${member.progress_pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
