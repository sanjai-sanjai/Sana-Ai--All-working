import { X, VideoOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface MeetSummaryCardProps {
  startedBy: string;
  durationString: string;
  participantCount: number;
  onDismiss: () => void;
}

export function MeetSummaryCard({ startedBy, durationString, participantCount, onDismiss }: MeetSummaryCardProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
        className="mx-4 mb-4 overflow-hidden rounded-[28px] bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-100/50"
      >
        <div className="flex items-center justify-between p-4 px-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500">
            <VideoOff className="h-[20px] w-[20px] fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[15px] font-bold text-gray-900 tracking-[-0.01em]">Meeting Ended</h4>
            </div>
            <p className="text-[12.5px] font-semibold text-gray-500 mt-0.5">
              Started by {startedBy}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end mr-2">
            <span className="text-[13px] font-bold text-gray-900">Duration: {durationString}</span>
            <span className="text-[12px] font-medium text-gray-500">{participantCount} Members joined</span>
        </div>
        <button 
          onClick={onDismiss}
          className="grid h-8 w-8 ml-1 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <X className="h-[20px] w-[20px] stroke-[2.5]" />
        </button>
      </div>
    </motion.div>
    </AnimatePresence>
  );
}
