import { Link, useLocation } from "@tanstack/react-router";
import { 
  Home, Users, BarChart3, User, Settings, HelpCircle, 
  MessageSquare, LogOut, ChevronRight, Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import sanaAvatar from "@/assets/reply-avatar.png";

const topItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/study-together", label: "Study Together", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
];

const bottomItems = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help & Support", icon: HelpCircle },
  { to: "/feedback", label: "Feedback", icon: MessageSquare },
];

export function PremiumSidebar() {
  const loc = useLocation();
  const { user, signOut } = useAuth();
  
  return (
    <aside className="hidden lg:flex flex-col w-[260px] h-[calc(100dvh-5rem)] bg-white/95 backdrop-blur-xl border-r border-border/60 shadow-[2px_0_24px_rgba(0,0,0,0.02)] mr-6 rounded-[32px] overflow-hidden my-10 sticky top-10 shrink-0 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8f9fa] to-white pointer-events-none z-[-1]" />
      
      {/* Header */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 shrink-0 rounded-[14px] bg-gradient-to-br from-[#6366f1] to-[#4f46e5] grid place-items-center shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold tracking-tight text-gray-900">Sana AI</h1>
            <p className="text-[12px] font-semibold text-gray-400">Learning Ecosystem</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-1.5">
          {topItems.map((item) => {
            const active = loc.pathname.startsWith(item.to) || (item.to === '/home' && loc.pathname === '/');
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-[14px]",
                  active 
                    ? "bg-[#f3f0ff] text-[#6366f1]" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px]", active ? "stroke-[2.5]" : "stroke-[2]")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1" />

      {/* Footer Nav */}
      <div className="px-6 pb-6">
        <nav className="space-y-1 mb-6">
          {bottomItems.map((item) => {
            const active = loc.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-[14px] transition-all font-semibold text-[13px]",
                  active 
                    ? "text-[#6366f1] bg-[#f3f0ff]" 
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Snippet */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between cursor-pointer hover:border-gray-200 transition-colors group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-white shadow-sm ring-1 ring-gray-200">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <img src={sanaAvatar} alt="Sana Avatar" className="h-full w-full object-cover p-1 bg-[#f3f0ff]" />
              )}
            </div>
            <div className="min-w-0 pr-2">
              <p className="text-[13px] font-bold text-gray-900 truncate tracking-tight">{user?.user_metadata?.display_name || "User"}</p>
              <p className="text-[11px] font-semibold text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => signOut()} className="text-gray-400 hover:text-red-500 transition-colors active:scale-95">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
