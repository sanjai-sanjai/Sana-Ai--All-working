import { MoreHorizontal } from "lucide-react";
import { MemberWithProfile } from "@/hooks/use-study-groups";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useResolvedAvatar } from "@/hooks/use-resolved-avatar";
import { useRemoveMemberMutation, usePromoteAdminMutation } from "@/hooks/use-study-groups";

// Custom icons matching design for strengths
function StrengthIcon({ strength }: { strength: string }) {
  // We can pick an icon based on string match or just return a default generic one.
  return (
    <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function getStrengthColor(strength: string, index: number) {
  const colors = [
    { bg: "bg-[#F3F0FF]", text: "text-[#6366f1]" }, // Purple
    { bg: "bg-[#ecfdf5]", text: "text-[#10b981]" }, // Green
    { bg: "bg-[#fff7ed]", text: "text-[#f97316]" }, // Orange
  ];
  return colors[index % colors.length];
}

interface MemberProgressCardProps {
  member: MemberWithProfile;
  isCurrentUserOwnerOrAdmin: boolean;
  currentUserRole: string;
  onViewProfile: (member: MemberWithProfile) => void;
  onEditProfile: () => void;
  isYou: boolean;
}

export function MemberProgressCard({ 
  member, 
  isCurrentUserOwnerOrAdmin,
  onViewProfile,
  onEditProfile,
  isYou
}: MemberProgressCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const resolvedAvatar = useResolvedAvatar(member.profiles?.avatar_url || null);
  
  const removeMutation = useRemoveMemberMutation();
  const promoteMutation = usePromoteAdminMutation();

  const handleRemove = async () => {
    if (confirm(`Remove ${member.profiles?.display_name} from group?`)) {
      try {
        await removeMutation.mutateAsync({ groupId: member.group_id, userId: member.user_id });
        toast.success("Member removed");
      } catch (err: any) {
        toast.error("Failed to remove member: " + err.message);
      }
    }
  };

  const handlePromote = async () => {
    if (confirm(`Promote ${member.profiles?.display_name} to Admin?`)) {
      try {
        await promoteMutation.mutateAsync({ groupId: member.group_id, userId: member.user_id });
        toast.success("Member promoted to admin");
      } catch (err: any) {
        toast.error("Failed to promote member: " + err.message);
      }
    }
  };

  const progress = member.progress_pct || 0;
  const strokeDasharray = 2 * Math.PI * 18; // radius is 18
  const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;
  
  // Decide badge styling based on role or isYou
  const roleBadge = isYou ? { text: "You", bg: "bg-[#F3F0FF]", fg: "text-[#6366f1]" } 
                  : member.role === 'owner' ? { text: "Owner", bg: "bg-[#FEF3C7]", fg: "text-[#f59e0b]" }
                  : { text: "Member", bg: "bg-[#F3F0FF]", fg: "text-[#6366f1]" };

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 relative mb-3">
      <div className="flex justify-between items-center">
        {/* Left: Avatar & Info */}
        <div className="flex items-center gap-4">
          <div className="h-[52px] w-[52px] rounded-full overflow-hidden bg-[#F3F0FF] shadow-sm border border-gray-100 shrink-0">
            {member.profiles?.avatar_url ? (
              <img src={resolvedAvatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-[#6366f1] font-bold text-xl">
                {member.profiles?.display_name?.substring(0, 1) || "U"}
              </div>
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-[16px] font-extrabold text-gray-900 tracking-[-0.01em]">
                {member.profiles?.display_name}
              </h4>
              <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-bold", roleBadge.bg, roleBadge.fg)}>
                {roleBadge.text}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[12px] font-medium text-gray-500">
              {member.role === 'owner' && (
                <span className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Team Owner
                </span>
              )}
              {member.role === 'owner' && <span>•</span>}
              <span className="flex items-center gap-1">
                <div className={cn("h-1.5 w-1.5 rounded-full", member.is_online || member.study_status === 'studying' ? "bg-emerald-500" : "bg-orange-400")} />
                {member.is_online || member.study_status === 'studying' ? "Active now" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Progress */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[20px] font-bold tracking-tight text-[#6366f1] leading-none mb-0.5">{progress}%</p>
            <p className="text-[11px] font-medium text-gray-500">Progress</p>
          </div>
          <svg className="w-12 h-12 transform -rotate-90">
            <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
            <circle 
              cx="24" cy="24" r="18" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="transparent" 
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="text-[#6366f1] transition-all duration-1000 ease-out" 
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Bottom: Strengths & Menu */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[13px] font-semibold text-gray-500 mb-2">Top Strengths</p>
          <div className="flex flex-wrap gap-2">
            {member.group_member_profiles?.strongest_skills?.slice(0, 3).map((strength, idx) => {
              const color = getStrengthColor(strength, idx);
              return (
                <div key={idx} className={cn("flex items-center px-2.5 py-1.5 rounded-lg text-[12px] font-bold shadow-sm", color.bg, color.text)}>
                  <StrengthIcon strength={strength} />
                  {strength}
                </div>
              );
            })}
            {(!member.group_member_profiles?.strongest_skills || member.group_member_profiles.strongest_skills.length === 0) && (
              <span className="text-[12px] text-gray-400 font-medium italic">No strengths listed</span>
            )}
          </div>
        </div>

        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
        >
          <MoreHorizontal className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Menu Dropdown */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-[40]" onClick={() => setShowMenu(false)} />
          <div className="absolute bottom-12 right-5 z-[50] w-48 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setShowMenu(false); onViewProfile(member); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              View Profile
            </button>
            <button 
              onClick={() => { setShowMenu(false); onEditProfile(); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              Edit Learning Profile
            </button>
            {isCurrentUserOwnerOrAdmin && member.role !== 'owner' && (
              <>
                <div className="h-[1px] bg-gray-100" />
                {member.role !== 'admin' && (
                  <button 
                    onClick={() => { setShowMenu(false); handlePromote(); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-[13px] font-bold text-[#6366f1] hover:bg-[#F3F0FF] transition-colors text-left"
                  >
                    Promote Admin
                  </button>
                )}
                <button 
                  onClick={() => { setShowMenu(false); handleRemove(); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  Remove Member
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
