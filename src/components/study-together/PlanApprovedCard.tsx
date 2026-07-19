import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, BarChart2, Users, BookOpen, Sparkles, Clock, Target } from 'lucide-react';

interface Assignment {
  title: string;
  assigned_to: string;
  estimated_time: string;
}

interface PlanApprovedCardProps {
  assignments: Assignment[];
  members: any[];
  onGoToSpace: () => void;
}

export function PlanApprovedCard({ assignments, members, onGoToSpace }: PlanApprovedCardProps) {
  // Group assignments by member
  const memberOptions = members.map(m => ({
    id: m.id || m.user_id,
    name: m.name || m.profiles?.display_name || m.profiles?.username || "Unknown",
    avatar: m.profiles?.avatar_url,
  }));

  const assignmentsByMember = memberOptions.map(member => {
    const memberAssignments = (assignments || []).filter(a => 
      a.assigned_to?.trim().toLowerCase() === member.name?.trim().toLowerCase()
    );
    
    const topicsCount = memberAssignments.length;
    let totalMins = 0;
    memberAssignments.forEach(a => {
      const matchH = a.estimated_time.match(/(\d+)\s*(h|hr|hrs|hour|hours)/i);
      const matchM = a.estimated_time.match(/(\d+)\s*(m|min|mins|minute|minutes)/i);
      if (matchH) totalMins += parseInt(matchH[1]) * 60;
      if (matchM) totalMins += parseInt(matchM[1]);
    });
    
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const estTimeStr = hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;

    return {
      member,
      topicsCount,
      estTimeStr: totalMins > 0 ? estTimeStr : '0h',
    };
  }).filter(g => g.topicsCount > 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[550px] font-sans mt-3 mb-3 flex flex-col gap-4"
    >
      {/* Sleek Hero Banner */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f5f3ff] via-[#faf5ff] to-white p-7 border border-[#ede9fe] shadow-[0_8px_30px_rgba(139,92,246,0.04)]">
        <div className="absolute -right-6 -top-6 w-40 h-40 bg-gradient-to-br from-[#8b5cf6] to-[#d946ef] rounded-full blur-[50px] opacity-15 mix-blend-multiply" />
        <div className="relative z-10 flex gap-5 items-center">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-[0_4px_14px_rgba(139,92,246,0.12)] flex items-center justify-center shrink-0">
            <Sparkles className="w-7 h-7 text-[#8b5cf6]" />
          </div>
          <div>
            <h2 className="text-[21px] font-extrabold text-gray-900 tracking-tight leading-tight mb-1">
              Plan Approved!
            </h2>
            <p className="text-[13.5px] text-gray-500 font-medium leading-relaxed">
              Topics are perfectly distributed based on everyone's strengths.
            </p>
          </div>
        </div>
      </div>

      {/* Member Assignments Grid */}
      <div className="grid grid-cols-2 gap-4">
        {assignmentsByMember.map((group, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx} 
            className="bg-white rounded-[24px] p-5 border border-gray-100/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden group flex flex-col h-[140px]"
          >
            {/* Soft background glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#f5f3ff]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 flex items-center justify-between mb-auto">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {group.member.avatar ? (
                     <img src={group.member.avatar} alt={group.member.name} className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white" />
                  ) : (
                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] text-white flex items-center justify-center font-bold text-[15px] shadow-sm ring-2 ring-white">
                       {group.member.name.charAt(0).toUpperCase()}
                     </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#10b981] rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <h4 className="text-[14.5px] font-bold text-gray-900 leading-tight">{group.member.name}</h4>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-50/80 text-gray-600 border border-gray-100">
                <Target className="w-[14px] h-[14px]" />
                <span className="text-[12px] font-bold">{group.topicsCount}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#f5f3ff]/60 text-[#7c3aed] border border-[#ede9fe]">
                <Clock className="w-[14px] h-[14px]" />
                <span className="text-[12px] font-bold">{group.estTimeStr}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Steps & Button */}
      <div className="bg-white rounded-[28px] p-6 border border-gray-100/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mt-2">
        <h3 className="text-[16px] font-extrabold text-gray-900 tracking-tight mb-6 flex items-center gap-2">
          What's Next
        </h3>

        <div className="relative space-y-6 mb-8 before:absolute before:left-[23px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-gray-100 before:to-transparent">
          {[
            { icon: BookOpen, title: "Head to My Study Space", desc: "Access your personalized learning materials", color: "text-[#8b5cf6]", bg: "bg-[#f5f3ff]", border: "border-[#ede9fe]" },
            { icon: BarChart2, title: "Update Your Progress", desc: "Mark topics complete as you learn", color: "text-[#f59e0b]", bg: "bg-[#fffbeb]", border: "border-[#fef3c7]" },
            { icon: Users, title: "Collaborate Together", desc: "Help teammates in the group chat", color: "text-[#10b981]", bg: "bg-[#ecfdf5]", border: "border-[#d1fae5]" },
          ].map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-4 group cursor-default">
              <div className={`relative z-10 w-12 h-12 rounded-[18px] ${step.bg} flex items-center justify-center shrink-0 border ${step.border} shadow-sm ring-4 ring-white group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className={`w-[22px] h-[22px] ${step.color}`} />
              </div>
              <div className="pt-2">
                <h4 className="text-[14.5px] font-bold text-gray-900 leading-tight">{step.title}</h4>
                <p className="text-[13px] font-medium text-gray-500 mt-1 leading-snug">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={onGoToSpace}
          className="relative group w-full flex items-center justify-center gap-3 py-4 rounded-[20px] text-[15px] font-bold text-white bg-[#18181b] overflow-hidden transition-all hover:bg-black hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)]"
        >
          <span>Launch Workspace</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

