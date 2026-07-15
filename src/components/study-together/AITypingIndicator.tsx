import { motion } from "framer-motion";

/**
 * Three-dot bouncing animation inside an AI avatar bubble.
 * Shows while @Sana_AI is generating a response.
 * Matches the existing motion.div animation patterns in the project.
 */
export function AITypingIndicator() {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: [0, -5, 0] },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex items-start gap-4 w-full"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#2d2b55] mt-1 shadow-md">
        <span className="text-xl">🤖</span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-2.5 ml-1 mb-2">
          <span className="text-[15px] font-bold text-[#6366f1]">Sana AI</span>
          <span className="rounded-md bg-[#6366f1] px-2 py-0.5 text-[10px] font-bold text-white tracking-wider">BOT</span>
        </div>

        <div className="rounded-[24px] rounded-tl-[8px] bg-white border border-gray-100 px-6 py-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-1.5 h-5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                variants={dotVariants}
                initial="initial"
                animate="animate"
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 0.6,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
                className="h-2.5 w-2.5 rounded-full bg-[#6366f1]/60"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
