import { X, Video, Users } from "lucide-react";
import { format } from "date-fns";

interface LiveMeetBannerProps {
  startedBy: string;
  timeStarted: string | Date;
  timerString: string;
  activeMembersCount: number;
  totalMembers: number;
  isCreator: boolean;
  onJoin: () => void;
  onEnd: () => void;
}

export function LiveMeetBanner({ 
  startedBy, 
  timeStarted, 
  timerString,
  activeMembersCount,
  totalMembers,
  isCreator,
  onJoin, 
  onEnd 
}: LiveMeetBannerProps) {
  
  const formattedTime = typeof timeStarted === 'string' 
    ? new Date(timeStarted) 
    : timeStarted;

  return (
    <div className="mx-4 mb-4 overflow-hidden rounded-[28px] bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-100/50 relative">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-5 gap-3">
        <div className="flex items-center gap-3.5">
          <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#f3f0ff] text-[#6366f1] relative">
            <span className="absolute -top-1 -right-1 flex h-[10px] w-[10px]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-60" />
                <span className="relative inline-flex h-[10px] w-[10px] rounded-full bg-[#10b981]" />
            </span>
            <Video className="h-[20px] w-[20px] fill-current" />
          </div>
          <div className="flex flex-col justify-center">
            <h4 className="text-[15px] font-bold text-gray-900 tracking-[-0.01em] flex items-center gap-1.5">
              Live Study Session
            </h4>
            <p className="text-[12.5px] font-semibold text-gray-500 mt-0.5">
              Started by {startedBy} • {format(formattedTime, "h:mm a")}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2.5">
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5 border border-gray-100">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-[12px] font-bold text-gray-600">
              {activeMembersCount} / {totalMembers} Joined
            </span>
          </div>

          <div className="rounded-lg bg-[#f3f0ff] px-2.5 py-1.5 text-[13px] font-bold text-[#6366f1] tabular-nums min-w-[70px] text-center">
            {timerString}
          </div>
          
          <button 
            onClick={onJoin}
            className="rounded-xl bg-[#6366f1] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#5A48F9] active:scale-95 transition-all tracking-wide shadow-[0_4px_12px_rgb(99,102,241,0.2)]"
          >
            JOIN MEET
          </button>
          
          {isCreator && (
            <button 
              onClick={onEnd}
              className="rounded-xl bg-red-50 px-4 py-2.5 text-[13px] font-bold text-red-600 hover:bg-red-100 active:scale-95 transition-all tracking-wide ml-1 border border-red-100"
            >
              END
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
