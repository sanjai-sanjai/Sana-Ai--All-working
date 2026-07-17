import { X, Video } from "lucide-react";

interface LiveMeetBannerProps {
  startedBy: string;
  timeStarted: string;
  onJoin: () => void;
  onDismiss: () => void;
}

export function LiveMeetBanner({ startedBy, timeStarted, onJoin, onDismiss }: LiveMeetBannerProps) {
  return (
    <div className="mx-4 mb-4 overflow-hidden rounded-[28px] bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-100/50">
      <div className="flex items-center justify-between p-4 px-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#f3f0ff] text-[#6366f1]">
            <Video className="h-[20px] w-[20px] fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-[10px] w-[10px]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-60" />
                <span className="relative inline-flex h-[10px] w-[10px] rounded-full bg-[#10b981]" />
              </span>
              <h4 className="text-[15px] font-bold text-gray-900 tracking-[-0.01em]">Live Study Session is active</h4>
            </div>
            <p className="text-[12.5px] font-semibold text-gray-500 mt-0.5">
              Started by {startedBy} • 12:30 PM
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-[#f3f0ff] px-2.5 py-1.5 text-[13px] font-bold text-[#6366f1]">
            00:24:15
          </div>
          <button 
            onClick={onJoin}
            className="rounded-xl bg-[#6366f1] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#5A48F9] active:scale-95 transition-all tracking-wide shadow-[0_4px_12px_rgb(99,102,241,0.2)]"
          >
            JOIN MEET
          </button>
          <button 
            onClick={onDismiss}
            className="grid h-8 w-8 ml-1 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <X className="h-[20px] w-[20px] stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
