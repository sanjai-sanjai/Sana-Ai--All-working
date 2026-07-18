import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Assignment {
  title: string;
  assigned_to: string;
  estimated_time: string;
  difficulty: string;
  reason: string;
}

interface SmartDistributionData {
  type: string;
  chapter: string;
  assignments: Assignment[];
}

interface SmartTopicDistributionCardProps {
  data: SmartDistributionData;
  members: any[];
  onApprove: (assignments: any[]) => void;
  onCancel: () => void;
  onReassign: () => void;
}

export function SmartTopicDistributionCard({ data, members, onApprove, onCancel, onReassign }: SmartTopicDistributionCardProps) {
  // Group assignments by member
  const memberOptions = members.map(m => ({
    id: m.id || m.user_id,
    name: m.name || m.profiles?.display_name || m.profiles?.username || "Unknown",
    avatar: m.profiles?.avatar_url,
    topSkill: m.group_member_profiles?.strongest_skills?.[0] || 'General'
  }));

  const assignmentsByMember = memberOptions.map(member => {
    const memberAssignments = (data.assignments || []).filter(a => 
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
      assignments: memberAssignments,
      topicsCount,
      estTimeStr: totalMins > 0 ? estTimeStr : '0h',
      reason: memberAssignments[0]?.reason || "Assigned based on overall profile balance."
    };
  }).filter(g => g.topicsCount > 0);

  const totalAssignedTopics = data.assignments?.length || 0;

  return (
    <div className="w-full max-w-[550px] bg-white rounded-[24px] border border-[#e2e8f0]/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden font-sans mt-2 mb-2 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#6366f1]" />
          <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">Smart Topic Distribution</h3>
        </div>
        <div className="bg-[#f3f0ff] text-[#6366f1] px-3 py-1 rounded-full text-[12px] font-bold shadow-sm">
          Proposed Plan
        </div>
      </div>

      <div className="mb-6">
        <p className="text-[12px] text-gray-400 font-medium uppercase tracking-wider mb-1">Chapter</p>
        <p className="text-[14px] font-bold text-gray-800">{data.chapter}</p>
        
        <div className="flex items-center gap-12 mt-4 mb-3">
          <div>
            <p className="text-[12px] text-gray-400 font-medium">Total Topics</p>
            <p className="text-[14px] font-bold text-gray-800">{totalAssignedTopics}</p>
          </div>
          <div>
            <p className="text-[12px] text-gray-400 font-medium">Team Members</p>
            <p className="text-[14px] font-bold text-gray-800">{assignmentsByMember.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-[12px] text-gray-400 font-medium w-14">Coverage</p>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#6366f1] rounded-full" style={{ width: '100%' }} />
          </div>
          <span className="text-[12px] font-bold text-[#6366f1]">100%</span>
        </div>
      </div>

      <p className="text-[13.5px] font-bold text-gray-800 mb-4">Here's how I propose to split the topics 👇</p>

      <div className="space-y-3 mb-6">
        {assignmentsByMember.map((group, idx) => (
          <div key={idx} className="border border-gray-100 rounded-[20px] p-4 shadow-sm bg-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {group.member.avatar ? (
                  <img src={group.member.avatar} alt={group.member.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#6366f1] text-white flex items-center justify-center font-bold text-[16px]">
                    {group.member.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-[15px] font-bold text-gray-900 leading-tight">{group.member.name}</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[11px] text-[#6366f1] bg-[#f3f0ff] px-2 py-0.5 rounded-md font-bold">Strong in {group.member.topSkill}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[13px] font-bold text-[#6366f1]">{group.topicsCount} Topics</p>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Est. Time</p>
                <p className="text-[12px] font-bold text-gray-700">{group.estTimeStr}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-gray-400 font-medium mb-2 uppercase tracking-wider">Assigned Topics</p>
                <ul className="space-y-1.5">
                  {group.assignments.map((a, i) => (
                    <li key={i} className="text-[13px] font-semibold text-gray-800 flex items-start gap-1.5 leading-snug">
                      <span className="text-[#6366f1] mt-0.5">•</span>
                      <span>{a.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pl-3 border-l border-gray-100">
                <p className="text-[11px] text-gray-400 font-medium mb-1 uppercase tracking-wider">Why?</p>
                <p className="text-[12px] text-gray-600 leading-relaxed font-medium">
                  {group.reason}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button 
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={onReassign}
          className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-[#6366f1] bg-[#f3f0ff] hover:bg-[#e5e0ff] transition-colors"
        >
          Reassign Topics
        </button>
        <button 
          onClick={() => {
            onApprove(data.assignments.map(a => {
               const member = memberOptions.find(m => m.name?.trim().toLowerCase() === a.assigned_to?.trim().toLowerCase());
               return { ...a, member_id: member?.id || null };
            }));
          }}
          className="flex-[1.5] py-3 rounded-2xl text-[14px] font-bold text-white bg-[#6366f1] hover:bg-[#4f46e5] shadow-[0_4px_14px_rgba(99,102,241,0.3)] transition-all"
        >
          Approve Plan
        </button>
      </div>
    </div>
  );
}
