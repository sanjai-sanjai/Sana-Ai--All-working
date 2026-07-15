import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/app/TopBar";
import { Search, MoreVertical, Plus, BookOpen, Users, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useStudyGroups, StudyGroup } from "@/hooks/use-study-groups";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/study-together/")({
  component: StudyTogetherScreen,
});

function StudyTogetherScreen() {
  const { user } = useAuth();
  const { data: groups, isLoading, error } = useStudyGroups(user?.id);
  const queryClient = useQueryClient();

  // Realtime subscription for group updates (Step 6)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_group_members',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Invalidate queries when the current user is added to a new group or changes status
          queryClient.invalidateQueries({ queryKey: ["study-groups"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_groups',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["study-groups"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return (
    <div className="min-h-svh bg-background pb-24">
      <TopBar
        title="Study Together"
        subtitle="Your study groups"
        back="/home"
        hideDefaults
        right={
          <>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-card shadow-card">
              <Search className="h-5 w-5" />
            </button>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-card shadow-card">
              <MoreVertical className="h-5 w-5" />
            </button>
          </>
        }
      />

      <div className="relative mx-4 mt-2">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search groups"
          className="h-14 w-full rounded-[20px] border border-border bg-card pl-12 pr-14 text-[15px] font-medium shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Link
          to="/study-together/create"
          className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm active:scale-95"
        >
          <Plus className="h-5 w-5" />
        </Link>
      </div>

      <div className="mx-4 mt-6">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 w-full animate-pulse rounded-[24px] bg-muted" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-center text-red-600">
            <AlertCircle className="mx-auto mb-2 h-8 w-8" />
            <p className="font-bold">Failed to load groups</p>
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        )}

        {!isLoading && !error && groups?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold">No groups yet</h3>
            <p className="mt-2 max-w-[250px] text-sm text-muted-foreground">
              Create a study group and invite your friends to start learning together!
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {groups?.map((group: any) => {
            const timeAgo = formatDistanceToNow(new Date(group.updated_at), { addSuffix: true });
            
            return (
              <Link 
                to={`/study-together/$groupId`} 
                params={{ groupId: group.id }} 
                key={group.id} 
                className="relative flex items-center gap-4 rounded-[24px] border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                {/* Avatar */}
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
                  {group.avatar_url ? (
                    <img src={group.avatar_url} alt={group.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-primary/10 text-primary font-bold text-lg">
                      {group.name.substring(0, 1)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-[16px] font-bold text-foreground leading-tight">{group.name}</h3>
                  <div className="mt-1 flex items-center gap-3 text-[13px] font-medium text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {group.subject || "General"}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Members</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                    {timeAgo.replace('about ', '')}
                  </span>
                  {/* Mock Unread count - to be implemented with read receipts later */}
                  <div className="grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                    1
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
