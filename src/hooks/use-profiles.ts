import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export function useSearchProfiles(usernameQuery: string) {
  return useQuery({
    queryKey: ["search-profiles", usernameQuery],
    queryFn: async () => {
      if (!usernameQuery.trim()) return [];
      
      // Search by username or display name pattern, ignore case
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .or(`username.ilike.%${usernameQuery}%,display_name.ilike.%${usernameQuery}%`)
        .limit(10);

      if (error) throw error;
      return data as Profile[];
    },
    enabled: usernameQuery.trim().length > 0,
    staleTime: 1000 * 60, // cache for 1 min
  });
}
