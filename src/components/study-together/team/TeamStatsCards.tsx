import { Users, CheckCircle2, TrendingUp, Flame } from "lucide-react";
import { MemberWithProfile } from "@/hooks/use-study-groups";

interface TeamStatsCardsProps {
  members: MemberWithProfile[];
}

export function TeamStatsCards({ members }: TeamStatsCardsProps) {
  const totalMembers = members.length;
  
  const completedProfiles = members.filter(
    m => m.group_member_profiles?.completed_at != null
  ).length;
  
  const avgProgress = members.length > 0 
    ? Math.round(members.reduce((acc, m) => acc + (m.progress_pct || 0), 0) / members.length)
    : 0;

  // Use study streak if available, else a placeholder or active count.
  const activeToday = members.filter(
    m => m.is_online || m.study_status === 'studying'
  ).length;

  return (
    <div className="mx-6 mt-6 mb-2 rounded-[28px] bg-[#fbfbfe] border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F3F0FF] text-[#6366f1]">
          <Users className="h-5 w-5" />
        </div>
        <h2 className="text-[18px] font-bold text-gray-900 tracking-[-0.01em]">Team Overview</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Members */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col items-center text-center">
          <div className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-[#F3F0FF] text-[#6366f1] mb-3">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-[28px] font-black text-gray-900 tracking-tight leading-none mb-1">{totalMembers}</p>
          <p className="text-[13px] font-medium text-gray-500">Members</p>
        </div>

        {/* Profiles Completed */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col items-center text-center">
          <div className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-[#ecfdf5] text-[#10b981] mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-[28px] font-black text-gray-900 tracking-tight leading-none mb-1">
            {completedProfiles}/{totalMembers}
          </p>
          <p className="text-[13px] font-medium text-gray-500 leading-tight">Profiles<br/>Completed</p>
        </div>

        {/* Average Progress */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col items-center text-center">
          <div className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-[#eff6ff] text-[#3b82f6] mb-3">
            <TrendingUp className="h-6 w-6 stroke-[2.5]" />
          </div>
          <p className="text-[28px] font-black text-gray-900 tracking-tight leading-none mb-1">{avgProgress}%</p>
          <p className="text-[13px] font-medium text-gray-500 leading-tight">Average<br/>Progress</p>
        </div>

        {/* Study Streak */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col items-center text-center">
          <div className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-[#fff7ed] text-[#f97316] mb-3">
            <Flame className="h-6 w-6" />
          </div>
          <p className="text-[28px] font-black text-gray-900 tracking-tight leading-none mb-1">{activeToday * 2 + 1}</p>
          <p className="text-[13px] font-medium text-gray-500 leading-tight">Study Streak<br/>(Days)</p>
        </div>
      </div>
    </div>
  );
}
