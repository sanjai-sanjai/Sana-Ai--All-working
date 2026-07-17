import { X, ChevronRight, Edit3 } from "lucide-react";
import { TeamMember } from "./TeamProgressOverview";

interface MembersPanelProps {
  members: TeamMember[];
  onClose?: () => void;
  onEditStrengths?: () => void;
}

export function MembersPanel({ members, onClose, onEditStrengths }: MembersPanelProps) {
  return (
    <div className="flex h-full flex-col bg-[#f8f9fe] p-6 pb-24 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Members & Progress</h2>
        {onClose && (
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <X className="h-5 w-5 stroke-[2]" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {members.map((member, index) => {
          const colors = ["bg-[#6366f1]", "bg-[#f59e0b]", "bg-[#10b981]", "bg-[#ef4444]"];
          const colorClass = colors[index % colors.length];
          
          return (
            <div key={member.id} className="flex items-center justify-between rounded-[24px] border border-gray-100 bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-14 w-14 overflow-hidden rounded-full bg-gray-50 shadow-sm border border-gray-100">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-[#f8f9fa] text-[16px] font-bold text-[#6366f1]">
                        {member.name.substring(0, 1)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[16px] font-bold text-gray-900">{member.name}</h4>
                    {member.is_you && <span className="text-[13px] font-semibold text-gray-400">(You)</span>}
                  </div>
                  <p className="text-[13px] font-medium text-gray-500 mt-0.5">
                    {member.id === members[0].id ? "Admin" : "Member"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5 pr-2">
                <div className="flex flex-col items-end">
                  <span className="text-[15px] font-bold text-gray-900 mb-1.5 tracking-tight">
                    {member.progress_pct}%
                  </span>
                  <div className="h-2 w-[72px] overflow-hidden rounded-full bg-gray-100">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                      style={{ width: `${member.progress_pct}%` }}
                    />
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 stroke-[2]" />
              </div>
            </div>
          );
        })}
      </div>
      
      <button 
        onClick={onEditStrengths}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-[20px] border-2 border-[#6366f1]/20 bg-[#f8f9ff] px-5 py-4 text-[15px] font-bold text-[#6366f1] shadow-sm hover:bg-[#eff1ff] active:scale-95 transition-all"
      >
        <Edit3 className="h-5 w-5" />
        Edit Strengths & Weaknesses
      </button>
    </div>
  );
}
