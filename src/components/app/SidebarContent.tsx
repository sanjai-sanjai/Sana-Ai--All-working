import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useResolvedAvatar } from "@/hooks/use-resolved-avatar";
import { 
  Home, Users, BarChart3, Calendar, BookOpen, Target, Brain, 
  Users2, Bell, Settings, MessageSquare, HelpCircle, LogOut,
  Shield, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useSidebarStore } from "@/store/useSidebarStore";

export function SidebarContent() {
  const loc = useLocation();
  const { user, signOut } = useAuth();
  const { setOpen } = useSidebarStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    }
  });

  const resolvedAvatarUrl = useResolvedAvatar(profile?.avatar_url ?? null);

  // Quick Stats
  const [stats, setStats] = useState({
    studyTime: "3h 42m",
    progress: "68%",
    groups: 4,
    resources: 128
  });

  useEffect(() => {
    if (!user?.id) return;
    // Mock Realtime Subscriptions, normally you would fetch real data
    const fetchStats = async () => {
       const { count: groupCount } = await supabase.from("study_group_members").select("*", { count: 'exact', head: true }).eq("user_id", user.id);
       const { count: resourceCount } = await supabase.from("group_resources").select("*", { count: 'exact', head: true }).eq("uploader_id", user.id);
       
       setStats(prev => ({
         ...prev,
         groups: groupCount || 0,
         resources: resourceCount || 0
       }));
    };
    fetchStats();
    
    const sub1 = supabase.channel('sidebar_resources').on('postgres_changes', { event: '*', schema: 'public', table: 'group_resources', filter: `uploader_id=eq.${user.id}` }, fetchStats).subscribe();
    const sub2 = supabase.channel('sidebar_groups').on('postgres_changes', { event: '*', schema: 'public', table: 'study_group_members', filter: `user_id=eq.${user.id}` }, fetchStats).subscribe();

    return () => {
      supabase.removeChannel(sub1);
      supabase.removeChannel(sub2);
    };
  }, [user?.id]);

  const navItems = [
    { section: "Main", items: [
      { to: "/home", label: "Home", icon: Home },
      { to: "/study-together", label: "Study Together", icon: Users },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
    ]},
    { section: "Study & Plan", items: [
      { to: "/schedule", label: "My Schedule", icon: Calendar },
      { to: "/resources", label: "My Resources", icon: BookOpen },
      { to: "/goals", label: "Goals", icon: Target },
      { to: "/profile", label: "AI Learning Profile", icon: Brain },
    ]},
    { section: "Community", items: [
      { to: "/friends", label: "Friends", icon: Users2 },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ]},
    { section: "General", items: [
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/feedback", label: "Feedback", icon: MessageSquare },
      { to: "/help", label: "Help & Support", icon: HelpCircle },
      { to: "/privacy-policy", label: "Privacy Policy", icon: Shield },
      { to: "/terms-of-service", label: "Terms of Service", icon: FileText },
    ]}
  ];

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden text-gray-900">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-6">
        
        {/* Header Section (Profile) */}
        <div className="pt-10 px-6 pb-6 bg-gradient-to-br from-[#f8f9fa] to-white border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 shrink-0 rounded-full bg-gray-100 shadow-sm border border-gray-200 overflow-hidden relative">
              <img src={resolvedAvatarUrl} alt="User" className="h-full w-full object-cover" />
              <div className="absolute bottom-0 right-0 h-4 w-4 bg-[#10b981] border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="text-[17px] font-bold truncate text-gray-900">{profile?.display_name || user?.user_metadata?.display_name || "Sana User"}</h2>
              <p className="text-[13px] font-medium text-gray-500 truncate">@{profile?.username || user?.email?.split('@')[0] || "user"}</p>
              
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 bg-[#fff7ed] text-[#f97316] px-2 py-0.5 rounded-full text-[11px] font-bold border border-[#ffedd5]">
                  🔥 28 Day Streak
                </span>
                <span className="flex items-center gap-1 bg-[#f3f0ff] text-[#6366f1] px-2 py-0.5 rounded-full text-[11px] font-bold border border-[#e0e7ff]">
                  ⭐ Level 8
                </span>
              </div>
              <p className="text-[11px] font-bold text-gray-400 mt-1.5 ml-1">420 XP</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f8f9fa] rounded-2xl p-3 border border-gray-100">
              <p className="text-[11px] font-semibold text-gray-500">Today's Study</p>
              <p className="text-[16px] font-bold text-gray-900 mt-0.5">{stats.studyTime}</p>
            </div>
            <div className="bg-[#f8f9fa] rounded-2xl p-3 border border-gray-100">
              <p className="text-[11px] font-semibold text-gray-500">Progress</p>
              <p className="text-[16px] font-bold text-[#6366f1] mt-0.5">{stats.progress}</p>
            </div>
            <div className="bg-[#f8f9fa] rounded-2xl p-3 border border-gray-100">
              <p className="text-[11px] font-semibold text-gray-500">Groups</p>
              <p className="text-[16px] font-bold text-gray-900 mt-0.5">{stats.groups}</p>
            </div>
            <div className="bg-[#f8f9fa] rounded-2xl p-3 border border-gray-100">
              <p className="text-[11px] font-semibold text-gray-500">Resources</p>
              <p className="text-[16px] font-bold text-gray-900 mt-0.5">{stats.resources}</p>
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="px-4 py-4 space-y-6">
          {navItems.map((group, idx) => (
            <div key={idx}>
              <h4 className="px-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">{group.section}</h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = loc.pathname.startsWith(item.to) || (item.to === '/home' && loc.pathname === '/');
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3.5 px-3 py-2.5 rounded-[16px] transition-all font-bold text-[14px]",
                        active 
                          ? "bg-[#6366f1] text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]" 
                          : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                      )}
                    >
                      <item.icon className={cn("h-[18px] w-[18px]", active ? "stroke-[2.5]" : "stroke-[2.5]")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Area (Logout) */}
      <div className="p-4 border-t border-gray-100 bg-[#f8f9fa]">
        {showLogoutConfirm ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <p className="text-[13px] font-bold text-gray-900 mb-3 text-center">Are you sure you want to logout?</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="flex-1 py-2 rounded-xl text-[13px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => signOut()} 
                className="flex-1 py-2 rounded-xl text-[13px] font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-[14px] font-bold text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5 stroke-[2.5]" />
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
