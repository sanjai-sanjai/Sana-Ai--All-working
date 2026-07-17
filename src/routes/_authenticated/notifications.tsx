import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/app/TopBar";
import sanaAvatar from "@/assets/sana-avatar.png";
import {
  Bell, Trophy, CheckCircle2, Phone, Calendar, Settings, Tag,
  Gift, ShieldCheck, Target, Users
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Notifications — Sana" },
      { name: "description", content: "Stay updated with reminders, AI calls, and study milestones." },
    ],
  }),
  component: NotificationsPage,
});

type Category = "reminder" | "ai_call" | "system" | "offer" | "achievement" | "group_invite";

const TABS: { id: "all" | Category; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All", icon: Bell },
  { id: "group_invite", label: "Invites", icon: Users },
  { id: "reminder", label: "Reminders", icon: Calendar },
  { id: "ai_call", label: "AI Calls", icon: Phone },
  { id: "system", label: "System", icon: Settings },
];

function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"all" | Category>("all");

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Realtime updates
  useEffect(() => {
    if (!user?.id) return;
    const channel = (supabase as any)
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const respondToInviteMutation = useMutation({
    mutationFn: async ({ groupId, accept, notificationId }: { groupId: string, accept: boolean, notificationId: string }) => {
      if (accept) {
        // Update member status
        await (supabase as any)
          .from("study_group_members")
          .update({ status: 'active' })
          .eq("group_id", groupId)
          .eq("user_id", user?.id!);
      } else {
        // Delete member row
        await (supabase as any)
          .from("study_group_members")
          .delete()
          .eq("group_id", groupId)
          .eq("user_id", user?.id!);
      }
      
      // Mark notification as read
      await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
    },
    onSuccess: (_, variables) => {
      if (variables.accept) {
        toast.success("Joined group successfully!");
        queryClient.invalidateQueries({ queryKey: ["study-groups"] });
      }
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const filtered = useMemo(
    () => (tab === "all" ? notifications : notifications?.filter((n: any) => n.type === tab)) || [],
    [notifications, tab],
  );

  return (
    <div className="pb-8 min-h-svh bg-background">
      <TopBar title="Notifications" subtitle="Stay updated with everything important." back="/home" />

      {/* Filter chips */}
      <div className="no-scrollbar -mx-1 mt-1 flex gap-2 overflow-x-auto px-5 pb-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-bold shadow-sm transition-all",
                active ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-primary-foreground/80" : "text-muted-foreground")} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="px-5 mt-6 space-y-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-28 w-full animate-pulse rounded-3xl bg-muted" />)}
          </div>
        )}
        
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
          </div>
        )}

        {filtered.map((n: any) => {
          const payload = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload;
          const isUnread = !n.is_read;

          return (
            <div key={n.id} className={cn(
              "relative overflow-hidden rounded-[24px] border p-5 shadow-sm transition-all",
              isUnread ? "border-primary/20 bg-primary/5" : "border-border bg-card",
              n.type === 'group_invite' && "border-blue-200 bg-blue-50/50"
            )}>
              {/* Unread dot */}
              {isUnread && (
                <div className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-primary" />
              )}
              
              <div className="flex gap-4">
                <div className="shrink-0">
                  {n.type === 'group_invite' ? (
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-600">
                      <Users className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                      <Bell className="h-6 w-6" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="text-[15px] font-bold text-foreground">
                    {n.type === 'group_invite' ? "Group Invitation" : "Notification"}
                  </h4>
                  <p className="mt-1 text-[13.5px] leading-snug text-muted-foreground whitespace-pre-wrap">
                    {n.type === 'group_invite' ? (
                      <>
                        <span className="font-bold text-foreground">{payload?.invited_by_name || "Someone"}</span> invited you to join the group <span className="font-bold text-foreground">{payload?.group_name}</span>.
                      </>
                    ) : (
                      "You have a new notification."
                    )}
                  </p>
                  
                  <div className="mt-2 text-[11.5px] font-bold text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>

                  {n.type === 'group_invite' && isUnread && (
                    <div className="mt-4 flex gap-3">
                      <button 
                        disabled={respondToInviteMutation.isPending}
                        onClick={() => respondToInviteMutation.mutate({ groupId: payload.group_id, accept: true, notificationId: n.id })}
                        className="flex-1 rounded-xl bg-primary py-2.5 text-[13px] font-bold text-white shadow-sm"
                      >
                        Accept
                      </button>
                      <button 
                        disabled={respondToInviteMutation.isPending}
                        onClick={() => respondToInviteMutation.mutate({ groupId: payload.group_id, accept: false, notificationId: n.id })}
                        className="flex-1 rounded-xl border border-border bg-card py-2.5 text-[13px] font-bold text-foreground hover:bg-muted"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
