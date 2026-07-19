import { ArrowLeft, Search, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface TeamDashboardHeaderProps {
  groupId: string;
  groupName: string;
  memberCount: number;
  onInviteClick: () => void;
}

export function TeamDashboardHeader({ groupId, groupName, memberCount, onInviteClick }: TeamDashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between py-4 px-6 bg-white border-b border-gray-100/60 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <Link 
          to="/study-together/$groupId" 
          params={{ groupId }}
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-800 stroke-[2.5]" />
        </Link>
        <div>
          <h1 className="text-[19px] font-bold text-gray-900 tracking-[-0.01em]">Team Progress</h1>
          <p className="text-[13px] font-medium text-gray-500 mt-0.5">
            {groupName} • {memberCount} Members
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-gray-50 transition-colors text-gray-600">
          <Search className="h-5 w-5" />
        </button>
        <button 
          onClick={onInviteClick}
          className="flex items-center gap-1.5 rounded-xl bg-[#6366f1] px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-[#5A48F9] active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          Invite
        </button>
      </div>
    </div>
  );
}
