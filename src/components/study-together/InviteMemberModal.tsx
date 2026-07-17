import { useState } from "react";
import { Search, X, UserPlus, Check } from "lucide-react";
import { useSearchProfiles, Profile } from "@/hooks/use-profiles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface InviteMemberModalProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
}

export function InviteMemberModal({ groupId, groupName, onClose }: InviteMemberModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults, isLoading } = useSearchProfiles(searchQuery);
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: async (profile: Profile) => {
      // 1. Insert into study_group_members as invited
      const { error: memberError } = await (supabase as any)
        .from("study_group_members")
        .insert({
          group_id: groupId,
          user_id: profile.user_id,
          role: "member",
          status: "invited",
          strengths: [],
          learning_preferences: {}
        });
        
      if (memberError) {
        if (memberError.code === '23505') throw new Error("User is already in the group");
        throw memberError;
      }

      // 2. Insert notification
      const { error: notifError } = await (supabase as any)
        .from("notifications")
        .insert({
          user_id: profile.user_id,
          type: "group_invite",
          payload: {
            group_id: groupId,
            group_name: groupName,
            invited_by: user?.id,
            invited_by_name: user?.user_metadata?.display_name || "Someone"
          }
        });

      if (notifError) throw notifError;
      return profile;
    },
    onSuccess: (profile) => {
      toast.success(`Invitation sent to @${profile.username}`);
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send invitation");
    }
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 px-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgb(0,0,0,0.15)] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[18px] font-bold text-foreground">Invite Member</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-muted hover:bg-gray-200 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="h-14 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-[14.5px] font-medium shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {searchQuery.trim().length > 0 && isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          )}
          
          {searchResults?.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">No users found for "@{searchQuery}"</div>
          )}

          {searchResults?.map(profile => (
            <div key={profile.user_id} className="flex items-center justify-between p-3 rounded-2xl border border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <img 
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
                  alt={profile.username} 
                  className="h-10 w-10 rounded-full object-cover bg-muted" 
                />
                <div>
                  <p className="text-[14px] font-bold text-foreground leading-tight">{profile.display_name}</p>
                  <p className="text-[12px] text-muted-foreground">@{profile.username}</p>
                </div>
              </div>
              
              <button 
                onClick={() => inviteMutation.mutate(profile)}
                disabled={inviteMutation.isPending}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-[12px] font-bold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
