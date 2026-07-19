import { useState, useEffect } from "react";
import { Sparkles, Info, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function TopicDistributionGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Only show if the user hasn't dismissed it previously
    const dismissed = localStorage.getItem("sana_topic_guide_dismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("sana_topic_guide_dismissed", "true");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText("@Sana_AI Distribute the topic: [Your Topic Here]");
    setCopied(true);
    toast.success("Command copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mx-4 my-3 relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-4 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)] group"
        >
          {/* Decorative background glow */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-[32px] group-hover:bg-indigo-500/20 transition-colors duration-500" />
          
          <button 
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-full p-1.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
            aria-label="Dismiss guide"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3.5 relative z-10">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-200">
              <Sparkles className="h-5 w-5" />
            </div>
            
            <div className="flex-1 pr-6">
              <h4 className="text-[14px] font-bold text-indigo-950 mb-1">
                Smart Topic Distribution
              </h4>
              <p className="text-[13px] text-indigo-900/70 leading-relaxed mb-3">
                Need to split study material among your team? Sana AI can automatically divide any subject based on each member's skill level. Just ask:
              </p>
              
              <div 
                onClick={copyToClipboard}
                className="group/code flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-indigo-200/60 bg-white/60 p-2.5 transition-all hover:border-indigo-300 hover:bg-white active:scale-[0.99]"
              >
                <code className="text-[12px] font-semibold text-indigo-700">
                  @Sana_AI Distribute the topic: [Your Topic Here]
                </code>
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-indigo-50 text-indigo-500 transition-colors group-hover/code:bg-indigo-100 group-hover/code:text-indigo-600">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
