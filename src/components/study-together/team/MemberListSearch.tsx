import { useState, useRef, useEffect } from "react";
import { Search, UserPlus, Check } from "lucide-react";
import { useSearchProfiles, Profile } from "@/hooks/use-profiles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface InviteNewMembersSectionProps {
  groupId: string;
  groupName: string;
}

export function InviteNewMembersSection({ groupId, groupName }: InviteNewMembersSectionProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
          status: "invited"
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
    onError: (err: any) => {
      toast.error(err.message || "Failed to send invitation");
    }
  });

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="px-6 mt-8 mb-6" ref={dropdownRef}>
      <h3 className="text-[17px] font-extrabold text-gray-900 tracking-[-0.01em] mb-4">Invite New Members</h3>
      <div className="flex flex-col relative">
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder="Search by username..."
              className="w-full bg-white border border-gray-200/80 rounded-2xl py-3.5 pl-12 pr-4 text-[15px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition-all placeholder:text-gray-400"
            />
          </div>
          <button 
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#a78bfa] hover:bg-[#8b5cf6] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(139,92,246,0.3)] transition-all shrink-0"
          >
            <UserPlus className="h-5 w-5" />
            Invite
          </button>
        </div>

        {/* Dropdown Results */}
        {isFocused && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 max-h-[300px] overflow-y-auto">
            {isLoading && (
              <div className="p-4 text-center text-[13px] font-medium text-gray-500">Searching...</div>
            )}
            
            {!isLoading && searchResults?.length === 0 && (
              <div className="p-4 text-center text-[13px] font-medium text-gray-500">No users found for "@{searchQuery}"</div>
            )}

            {!isLoading && searchResults?.map(profile => (
              <div key={profile.user_id} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-[#F3F0FF]">
                    <img 
                      src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
                      alt={profile.username} 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900 leading-tight">{profile.display_name}</p>
                    <p className="text-[12px] font-medium text-gray-500">@{profile.username}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => inviteMutation.mutate(profile)}
                  disabled={inviteMutation.isPending}
                  className="flex items-center gap-1.5 rounded-full bg-[#F3F0FF] px-3.5 py-1.5 text-[12px] font-bold text-[#6366f1] hover:bg-[#E0E7FF] transition-colors disabled:opacity-50"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
