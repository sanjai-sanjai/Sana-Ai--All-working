import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useStudyGroups, useGroupMembers } from "@/hooks/use-study-groups";
import { TeamDashboardHeader } from "@/components/study-together/team/TeamDashboardHeader";
import { TeamStatsCards } from "@/components/study-together/team/TeamStatsCards";
import { InviteNewMembersSection } from "@/components/study-together/team/MemberListSearch";
import { MemberProgressCard } from "@/components/study-together/team/MemberProgressCard";
import { AiTeamInsightsCard } from "@/components/study-together/team/AiTeamInsightsCard";
import { InviteMemberModal } from "@/components/study-together/InviteMemberModal";
import { Filter, ChevronDown } from "lucide-react";
import { LearningProfileEditor, LearningProfile } from "@/components/study-together/LearningProfileEditor";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useSaveGroupMemberProfile } from "@/hooks/use-study-groups";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/study-together/$groupId_/team")({
  component: TeamProgressDashboard,
});

function TeamProgressDashboard() {
  const { groupId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: groups } = useStudyGroups(user?.id);
  const { data: members, isLoading } = useGroupMembers(groupId);

  const group = groups?.find((g: any) => g.id === groupId);

  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const [editingProfileFor, setEditingProfileFor] = useState<string | null>(null);
  
  const saveProfileMutation = useSaveGroupMemberProfile();

  const handleSaveProfile = async (profileData: LearningProfile) => {
    if (!editingProfileFor) return;
    try {
      await saveProfileMutation.mutateAsync({
        group_id: groupId,
        user_id: editingProfileFor,
        ...(profileData as any)
      });
      toast.success("Learning profile updated!");
      setEditingProfileFor(null);
    } catch (err: any) {
      toast.error("Failed to update profile: " + err.message);
    }
  };

  // Realtime subscriptions
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`team-dashboard-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_group_members', filter: `group_id=eq.${groupId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_member_profiles', filter: `group_id=eq.${groupId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  const currentUserRole = useMemo(() => {
    return members?.find(m => m.user_id === user?.id)?.role || 'member';
  }, [members, user?.id]);

  const isCurrentUserOwnerOrAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    if (!searchQuery.trim()) return members;
    
    const query = searchQuery.toLowerCase();
    return members.filter(m => 
      m.profiles?.display_name?.toLowerCase().includes(query) ||
      m.profiles?.username?.toLowerCase().includes(query) ||
      m.role.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex-1 bg-[#FAFAFA] min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!group || !members) return null;

  return (
    <div className="flex flex-col flex-1 bg-[#FAFAFA] min-h-screen pb-20 overflow-y-auto hide-scrollbar">
      <TeamDashboardHeader 
        groupId={groupId}
        groupName={group.name}
        memberCount={members.length}
        onInviteClick={() => setShowInviteModal(true)}
      />

      <TeamStatsCards members={members} />
      
      <div className="px-6 mt-8 mb-4 flex items-center justify-between">
        <h3 className="text-[17px] font-extrabold text-gray-900 tracking-[-0.01em]">Team Members</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-100/80 rounded-xl py-2 pl-4 pr-10 text-[13px] font-bold text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.02)] focus:outline-none">
              <option>Sort by: Progress</option>
              <option>Sort by: Name</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <button className="grid h-9 w-9 place-items-center bg-white border border-gray-100/80 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="mx-6 mt-2 mb-6 p-8 bg-white rounded-[20px] border border-gray-100 flex flex-col items-center text-center shadow-sm">
          <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-[17px] font-bold text-gray-900 mb-1">No members found</h3>
          <p className="text-[14px] text-gray-500 font-medium">Try adjusting your search query or invite new members.</p>
        </div>
      ) : (
        <div className="px-6 flex flex-col gap-0 mb-4">
          {filteredMembers.map(member => (
            <MemberProgressCard
              key={member.user_id}
              member={member}
              isCurrentUserOwnerOrAdmin={isCurrentUserOwnerOrAdmin}
              currentUserRole={currentUserRole}
              onViewProfile={(m) => setEditingProfileFor(m.user_id)}
              onEditProfile={() => setEditingProfileFor(member.user_id)}
              isYou={member.user_id === user?.id}
            />
          ))}
        </div>
      )}

      <InviteNewMembersSection groupId={groupId} groupName={group.name} />

      <AiTeamInsightsCard members={members} />

      {/* Modals */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          groupId={groupId}
          groupName={group.name}
        />
      )}

      {editingProfileFor && (
        <div className="fixed inset-0 z-[200] bg-background pt-10 overflow-y-auto">
          <LearningProfileEditor
            onSave={handleSaveProfile}
            onCancel={() => setEditingProfileFor(null)}
            initialProfile={members.find(m => m.user_id === editingProfileFor)?.group_member_profiles as unknown as Partial<LearningProfile>}
          />
        </div>
      )}
    </div>
  );
}
