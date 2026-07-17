import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define local types to supplement the auto-generated types
export interface StudyGroup {
  id: string;
  name: string;
  subject?: string;
  semester?: string;
  description?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface StudyGroupMember {
  group_id: string;
  user_id: string;
  role: string;
  status: string; // 'active' | 'invited'
  progress_pct: number;
  is_online: boolean;
  last_seen: string;
  joined_at: string;
}

export interface GroupMemberProfile {
  id: string;
  group_id: string;
  user_id: string;
  strongest_skills: string[];
  weak_skills: string[];
  learning_style: string[];
  confidence_levels: Record<string, string>;
  teaching_preference: string | null;
  availability: string[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberWithProfile extends StudyGroupMember {
  profiles: {
    display_name: string;
    avatar_url: string;
    username: string;
  } | null;
  group_member_profiles: {
    completed_at: string | null;
  } | null;
}

// 1. Fetch user's active groups
export function useStudyGroups(userId: string | undefined) {
  return useQuery({
    queryKey: ["study-groups", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await (supabase as any)
        .from("study_group_members")
        .select(`
          role,
          study_groups (*)
        `)
        .eq("user_id", userId);

      if (error) throw error;
      
      // Transform data
      return data
        .map((row: any) => row.study_groups as unknown as StudyGroup)
        .filter(Boolean)
        .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    },
    enabled: !!userId,
  });
}

// 2. Fetch specific group members
export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const { data: members, error } = await (supabase as any)
        .from("study_group_members")
        .select(`
          *,
          profiles:user_id (display_name, avatar_url, username)
        `)
        .eq("group_id", groupId);

      if (error) throw error;

      const { data: gProfiles, error: pError } = await (supabase as any)
        .from("group_member_profiles")
        .select("user_id, completed_at")
        .eq("group_id", groupId);
        
      if (pError) throw pError;
      
      const profileMap = new Map(gProfiles?.map((p: any) => [p.user_id, p]) || []);

      return members.map((m: any) => ({
        ...m,
        group_member_profiles: profileMap.get(m.user_id) || null
      })) as unknown as MemberWithProfile[];
    },
    enabled: !!groupId,
  });
}

// 3. Atomic Group Creation RPC wrapper
export interface CreateGroupPayload {
  name: string;
  subject: string;
  semester: string;
  description: string;
  avatar_url?: string;
  members: {
    user_id: string;
    role: "owner" | "member";
    status: "active" | "invited";
  }[];
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateGroupPayload) => {
      // Execute the RPC function we created in the migration
      const { data, error } = await (supabase.rpc as any)("create_study_group_transaction", {
        p_name: payload.name,
        p_subject: payload.subject,
        p_semester: payload.semester,
        p_description: payload.description,
        p_avatar_url: payload.avatar_url || null,
        p_members: payload.members,
      });

      if (error) throw error;
      return data as string; // returns the new group_id UUID
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-groups"] });
    },
  });
}

// 4. Update Group mutation
export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, updates }: { groupId: string; updates: Partial<StudyGroup> }) => {
      const { data, error } = await (supabase as any)
        .from("study_groups")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", groupId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["study-groups"] });
    }
  });
}

// 5. Fetch specific member profile
export function useGroupMemberProfile(groupId: string, userId: string | undefined) {
  return useQuery({
    queryKey: ["group-member-profile", groupId, userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await (supabase as any)
        .from("group_member_profiles")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as GroupMemberProfile | null;
    },
    enabled: !!groupId && !!userId,
  });
}

// 6. Save member profile
export function useSaveGroupMemberProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileData: Partial<GroupMemberProfile> & { group_id: string; user_id: string }) => {
      const { data, error } = await (supabase as any)
        .from("group_member_profiles")
        .upsert({ 
          ...profileData, 
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: "group_id,user_id" })
        .select()
        .single();

      if (error) throw error;
      return data as GroupMemberProfile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["group-member-profile", data.group_id, data.user_id] });
      queryClient.invalidateQueries({ queryKey: ["group-members", data.group_id] });
    }
  });
}

// 7. Remove member or Leave group
export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await (supabase as any)
        .from("study_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      queryClient.invalidateQueries({ queryKey: ["study-groups"] });
    }
  });
}

// 8. Delete group
export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await (supabase as any)
        .from("study_groups")
        .delete()
        .eq("id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-groups"] });
    }
  });
}
