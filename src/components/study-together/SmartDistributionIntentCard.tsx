import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SmartDistributionIntentCardProps {
  introText: string;
  onGenerate: () => void;
}

export function SmartDistributionIntentCard({ introText, onGenerate }: SmartDistributionIntentCardProps) {
  const benefits = [
    "Based on individual strengths",
    "Balanced workload",
    "Best learning experience for everyone",
    "Covers the entire chapter efficiently"
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[450px] bg-white rounded-[24px] border border-[#e2e8f0]/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden font-sans mt-2 mb-2 p-5"
    >
      <p className="text-[14px] leading-relaxed text-gray-800 font-medium mb-5 whitespace-pre-wrap">
        {introText}
      </p>

      <div className="space-y-3 mb-6">
        {benefits.map((benefit, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-100/50" />
            <span className="text-[13.5px] font-semibold text-gray-700">{benefit}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onGenerate}
        className="w-full py-3 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[14px] font-bold shadow-sm transition-colors"
      >
        Generate Smart Distribution
      </button>
    </motion.div>
  );
}
