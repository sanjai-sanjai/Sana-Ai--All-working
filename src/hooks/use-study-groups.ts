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
  strengths: any;
  learning_preferences: any;
  is_online: boolean;
  last_seen: string;
  joined_at: string;
}

export interface MemberWithProfile extends StudyGroupMember {
  profiles: {
    display_name: string;
    avatar_url: string;
    username: string;
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
      const { data, error } = await (supabase as any)
        .from("study_group_members")
        .select(`
          *,
          profiles:user_id (display_name, avatar_url, username)
        `)
        .eq("group_id", groupId);

      if (error) throw error;
      return data as unknown as MemberWithProfile[];
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
    strengths?: any;
    learning_preferences?: any;
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
