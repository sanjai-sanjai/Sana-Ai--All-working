import { useState } from "react";
import { Settings, X, LogOut, Trash2, Edit3, UserPlus, Image as ImageIcon, Check } from "lucide-react";
import { useUpdateGroupMutation, StudyGroup } from "@/hooks/use-study-groups";
import { useAuth } from "@/hooks/use-auth";
import { InviteMemberModal } from "./InviteMemberModal";
import { LearningProfileEditor, LearningProfile } from "./LearningProfileEditor";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GroupSettingsPanelProps {
  group: StudyGroup;
  members: any[];
  onClose: () => void;
}

export function GroupSettingsPanel({ group, members, onClose }: GroupSettingsPanelProps) {
  const { user } = useAuth();
  const updateMutation = useUpdateGroupMutation();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const [subject, setSubject] = useState(group.subject || "");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const isOwner = members.find(m => m.user_id === user?.id)?.role === "owner";
  const myMemberRecord = members.find(m => m.user_id === user?.id);

  const handleSaveSettings = () => {
    updateMutation.mutate({
      groupId: group.id,
      updates: { name, subject }
    }, {
      onSuccess: () => {
        setIsEditing(false);
        toast.success("Group settings updated");
      }
    });
  };

  const handleUpdateLearningProfile = async (profile: LearningProfile) => {
    const { error } = await (supabase as any)
      .from("study_group_members")
      .update({
        strengths: profile.strengths,
        learning_preferences: profile.learning_styles
      })
      .eq("group_id", group.id)
      .eq("user_id", user?.id!);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Learning profile updated!");
      setShowProfileEditor(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[150] bg-background overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/80 backdrop-blur-xl px-5 py-4 border-b border-border">
        <h2 className="text-[18px] font-bold">Group Settings</h2>
        <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-muted">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-5 space-y-8 pb-32">
        {/* Profile / Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-24 w-24 rounded-3xl overflow-hidden bg-primary/10">
            {group.avatar_url ? (
              <img src={group.avatar_url} alt={group.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-[32px] font-bold text-primary">
                {group.name.substring(0, 1)}
              </div>
            )}
            {isOwner && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/50 backdrop-blur-md grid place-items-center cursor-pointer hover:bg-black/60 transition-colors">
                <ImageIcon className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          
          {isEditing && isOwner ? (
            <div className="w-full space-y-4 max-w-sm">
              <div>
                <label className="text-[12px] font-bold text-muted-foreground ml-1">Group Name</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-12 w-full rounded-2xl border border-border bg-card px-4 text-[15px] font-bold shadow-sm"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-muted-foreground ml-1">Subject</label>
                <input 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 h-12 w-full rounded-2xl border border-border bg-card px-4 text-[15px] font-bold shadow-sm"
                />
              </div>
              <button 
                onClick={handleSaveSettings}
                disabled={updateMutation.isPending}
                className="w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-white shadow-sm"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-[24px] font-bold">{group.name}</h1>
              <p className="text-[14px] text-muted-foreground mt-1">{group.subject || "No subject"}</p>
              {isOwner && (
                <button onClick={() => setIsEditing(true)} className="mt-3 flex items-center gap-1.5 mx-auto rounded-full bg-muted px-4 py-1.5 text-[13px] font-bold hover:bg-gray-200 transition-colors">
                  <Edit3 className="h-3.5 w-3.5" /> Edit Info
                </button>
              )}
            </div>
          )}
        </div>

        {/* Member Skills Section (Step 10) */}
        <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-bold">My Learning Profile</h3>
            <button 
              onClick={() => setShowProfileEditor(true)}
              className="text-[13px] font-bold text-primary hover:underline"
            >
              Edit Skills
            </button>
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Sana AI uses your strong areas and learning preferences to automatically distribute group tasks effectively.
          </p>
        </div>

        {/* Members Management (Step 7 & 8) */}
        <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[16px] font-bold">Members ({members.length})</h3>
            {isOwner && (
              <button 
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[12px] font-bold text-primary"
              >
                <UserPlus className="h-3.5 w-3.5" /> Invite
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {members.map((m: any) => (
              <div key={m.user_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={m.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.profiles?.username}`} alt="avatar" className="h-10 w-10 rounded-full object-cover bg-muted" />
                  <div>
                    <p className="text-[14px] font-bold leading-tight">
                      {m.profiles?.display_name} {m.user_id === user?.id && "(You)"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[12px] text-muted-foreground capitalize">{m.role}</span>
                      {m.status === 'invited' && <span className="rounded-md bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-700">Invited</span>}
                    </div>
                  </div>
                </div>
                {isOwner && m.user_id !== user?.id && (
                  <button className="text-[12px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-md">Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/50 py-4 text-[15px] font-bold text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-5 w-5" /> Leave Group
          </button>
          
          {isOwner && (
            <button className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/50 py-4 text-[15px] font-bold text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="h-5 w-5" /> Delete Group
            </button>
          )}
        </div>
      </div>

      {showInviteModal && (
        <InviteMemberModal 
          groupId={group.id} 
          groupName={group.name} 
          onClose={() => setShowInviteModal(false)} 
        />
      )}

      {showProfileEditor && myMemberRecord && (
        <div className="fixed inset-0 z-[200] bg-background pt-10 overflow-y-auto">
          <LearningProfileEditor 
            initialProfile={{
              strengths: myMemberRecord.strengths || [],
              weaknesses: [],
              learning_styles: myMemberRecord.learning_preferences || []
            }}
            onSave={handleUpdateLearningProfile}
            onCancel={() => setShowProfileEditor(false)}
          />
        </div>
      )}
    </div>
  );
}
