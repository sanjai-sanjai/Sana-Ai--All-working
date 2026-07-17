import { Search, MoreVertical, ArrowLeft, Video } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface GroupAppBarProps {
  groupId: string;
  groupName: string;
  memberCount: number;
  semester: string;
  avatarUrl?: string | null;
  onMeetClick: () => void;
  isMeetActive: boolean;
}

export function GroupAppBar({ 
  groupName, 
  memberCount, 
  semester, 
  avatarUrl, 
  onMeetClick,
  isMeetActive 
}: GroupAppBarProps) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-white/80 backdrop-blur-xl px-4 py-3.5 border-b border-gray-100 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-3">
        <Link to="/study-together" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-gray-900 active:scale-95 transition-transform hover:bg-gray-100">
          <ArrowLeft className="h-6 w-6 stroke-[2.5]" />
        </Link>
        <div className="flex items-center gap-3.5">
          {avatarUrl ? (
            <img src={avatarUrl} alt={groupName} className="h-[52px] w-[52px] rounded-full object-cover shadow-[0_4px_16px_rgb(0,0,0,0.1)] ring-2 ring-white" />
          ) : (
            <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] shadow-[0_4px_16px_rgb(0,0,0,0.15)] ring-2 ring-white">
              <span className="text-[18px] font-bold text-white">DS</span>
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="text-[17px] font-bold text-gray-900 leading-tight tracking-[-0.02em]">{groupName}</h2>
            <p className="text-[13px] font-semibold text-gray-500/80 leading-tight mt-0.5">
              {memberCount} members • {semester}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-0.5">
        <button 
          onClick={onMeetClick}
          className={cn(
            "flex items-center gap-1.5 h-[38px] px-4 rounded-full active:scale-95 transition-all ml-1 mr-2",
            isMeetActive ? "bg-red-50 text-red-500 animate-pulse ring-1 ring-red-100 shadow-[0_4px_12px_rgba(239,68,68,0.2)]" : "bg-[#f3f0ff] text-[#6366f1] hover:bg-[#e0e7ff]"
          )}
        >
          <Video className="h-[18px] w-[18px] fill-current stroke-[2.5]" />
          <span className="text-[14px] font-bold tracking-tight">Meet</span>
        </button>
        <button className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full text-gray-400 hover:text-gray-700 active:scale-95 transition-all hover:bg-gray-50">
          <Search className="h-[20px] w-[20px] stroke-[2.5]" />
        </button>
        <button className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full text-gray-400 hover:text-gray-700 active:scale-95 transition-all hover:bg-gray-50">
          <MoreVertical className="h-[20px] w-[20px] stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
