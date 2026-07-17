import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ChevronRight, Users, Plus, ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useStudyGroups } from "@/hooks/use-study-groups";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import sanaHero from "@/assets/sana-hero.png";
import roboImage from "@/assets/robo.png";

export const Route = createFileRoute("/_authenticated/study-together/")({
  component: StudyTogetherScreen,
});

const FRIENDS_ONLINE = [
  { id: 1, name: "Hari", status: "Online", statusColor: "bg-emerald-500", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hari&backgroundColor=f3f0ff" },
  { id: 2, name: "Akash", status: "In a group", statusColor: "bg-emerald-500", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Akash&backgroundColor=f3f0ff" },
  { id: 3, name: "Narmadha", status: "Studying Math", statusColor: "bg-emerald-500", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Narmadha&backgroundColor=f3f0ff" },
  { id: 4, name: "Naveen", status: "Online", statusColor: "bg-emerald-500", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Naveen&backgroundColor=f3f0ff" },
];

function StudyTogetherScreen() {
  const { user } = useAuth();
  const { data: groups, isLoading, error } = useStudyGroups(user?.id);
  const queryClient = useQueryClient();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const filteredGroups = groups?.filter((group: any) => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (group.subject && group.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleJoinSubmit = () => {
    if (joinCode.trim()) {
      toast.success(`Successfully joined group: ${joinCode}`);
      setShowJoinModal(false);
      setJoinCode("");
    }
  };

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
    <div className="min-h-svh bg-[#FAFAFC] pb-32 font-sans overflow-x-hidden relative">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link to="/home" className="text-gray-400 hover:text-gray-900 transition-colors active:scale-95 grid place-items-center">
              <ArrowLeft className="h-6 w-6 stroke-[2.5]" />
            </Link>
            <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight leading-tight">Study Together</h1>
          </div>
          <p className="text-[13px] text-gray-500 font-medium mt-0.5 pl-8">Join a group. Study, focus & grow together 💜</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSearching(!isSearching)} className="grid h-10 w-10 place-items-center rounded-full border border-gray-200/60 bg-white shadow-sm text-gray-700 active:scale-95 transition-transform hover:bg-gray-50">
            <Search className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {isSearching && (
        <div className="mx-5 mb-2 relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups or subjects..."
            className="h-12 w-full rounded-[20px] border border-gray-200/60 bg-white shadow-sm pl-12 pr-4 text-[14px] font-medium placeholder:text-gray-400 focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition-all"
            autoFocus
          />
        </div>
      )}

      {/* Hero Card */}
      <div className="mx-5 mt-2 relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#F4F1FF] to-[#EBE5FF] p-6 shadow-sm border border-white">
        <div className="relative z-10 max-w-[65%]">
          <h2 className="text-[20px] font-extrabold leading-[1.25] text-gray-900">
            Stronger Together,<br />
            <span className="text-[#6366F1]">Smarter Every Day!</span>
          </h2>
          <p className="mt-2.5 text-[12.5px] font-medium text-gray-500 leading-snug pr-4">
            Join a group, study together and stay consistent.
          </p>
        </div>
        <img src={sanaHero} alt="Sana" className="absolute -right-3 -bottom-1 h-[110%] object-contain drop-shadow-xl" />
        {/* Sparkles */}
        <div className="absolute top-4 right-1/3 text-white opacity-80 text-lg drop-shadow-sm">✨</div>
        <div className="absolute bottom-6 left-[45%] text-white opacity-60 text-sm drop-shadow-sm">✨</div>
      </div>

      {/* Join or Create */}
      <div className="mx-5 mt-8">
        <h3 className="text-[15px] font-extrabold text-gray-900 mb-3 tracking-tight">Join or Create a Study Group</h3>
        <div className="grid grid-cols-2 gap-3">
          <div onClick={() => setShowJoinModal(true)} className="flex flex-col rounded-[24px] bg-[#F8F6FF] p-4 border border-[#F3F0FF] shadow-sm active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="grid h-[42px] w-[42px] place-items-center rounded-full bg-[#8B5CF6] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)]">
                <Users className="h-5 w-5 fill-current" />
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" strokeWidth={3} />
            </div>
            <div className="text-[13px] font-bold text-[#6366F1] leading-tight">Join Study Group</div>
            <div className="text-[11px] text-gray-500 font-medium leading-tight mt-1 pr-2">Enter code to join a study group</div>
          </div>
          
          <Link to="/study-together/create" className="flex flex-col rounded-[24px] bg-[#F8F6FF] p-4 border border-[#F3F0FF] shadow-sm active:scale-[0.98] transition-transform relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="grid h-[42px] w-[42px] place-items-center rounded-full bg-[#A855F7] text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]">
                <Plus className="h-6 w-6 stroke-[3]" />
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" strokeWidth={3} />
            </div>
            <div className="text-[13px] font-bold text-[#6366F1] leading-tight">Create a Study Group</div>
            <div className="text-[11px] text-gray-500 font-medium leading-tight mt-1 pr-2">Create your own study group</div>
          </Link>
        </div>
      </div>

      {/* Your Study Groups */}
      <div className="mx-5 mt-8">
        <h3 className="text-[15px] font-extrabold text-gray-900 mb-3 tracking-tight">Your Study Groups</h3>
        
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-[84px] w-full animate-pulse rounded-[24px] bg-gray-200/50" />)}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {filteredGroups?.map((group: any, idx: number) => {
            const colors = [
              { bg: "bg-[#8B5CF6]" }, // Purple
              { bg: "bg-[#0EA5E9]" }, // Blue
              { bg: "bg-[#F43F5E]" }, // Pink
              { bg: "bg-[#F97316]" }, // Orange
            ];
            const color = colors[idx % colors.length];

            return (
              <Link 
                to={`/study-together/$groupId`} 
                params={{ groupId: group.id }} 
                key={group.id} 
                className="flex items-center gap-4 rounded-[24px] bg-white p-4 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-gray-100/60 hover:shadow-md active:scale-[0.98] transition-all"
              >
                {/* Icon */}
                <div className={cn("grid h-[54px] w-[54px] shrink-0 place-items-center rounded-[18px] text-white font-bold text-[18px] shadow-sm", color.bg)}>
                  {group.name.substring(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center gap-1.5">
                    <h4 className="truncate text-[15px] font-extrabold text-gray-900 tracking-tight">{group.name}</h4>
                  </div>
                  <div className="text-[11.5px] text-gray-500 font-medium mt-0.5 truncate">
                    {group.subject || "General Study"}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400 font-semibold">
                    <Users className="h-3 w-3" /> {group.member_count || 3} members
                  </div>
                </div>

                {/* Avatars */}
                <div className="flex items-center -space-x-2 shrink-0">
                  {[1, 2, 3].map(i => (
                    <img 
                      key={i} 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${group.id}${i}&backgroundColor=f3f0ff`} 
                      className="h-[30px] w-[30px] rounded-full border-2 border-white bg-gray-50" 
                      alt="member" 
                    />
                  ))}
                  <div className="grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-white bg-[#F3F0FF] text-[10px] font-bold text-[#6366F1]">
                    +2
                  </div>
                </div>
              </Link>
            );
          })}
          
          {filteredGroups?.length === 0 && (
            <div className="text-center py-8 text-gray-500 font-medium">
              No groups found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Friends Online */}
      <div className="mt-8 mb-6">
        <div className="flex items-center justify-between px-5 mb-4">
          <h3 className="text-[15px] font-extrabold text-gray-900 tracking-tight">Friends Online</h3>
          <button className="text-[12px] font-bold text-[#6366F1] active:opacity-70 transition-opacity">View All</button>
        </div>
        
        <div className="flex gap-3.5 px-5 overflow-x-auto hide-scrollbar pb-2">
          {FRIENDS_ONLINE.map(friend => (
            <div key={friend.id} className="flex flex-col items-center gap-2 min-w-[76px] rounded-[24px] bg-white p-3.5 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-gray-100/60 active:scale-95 transition-transform">
              <div className="relative">
                <img src={friend.avatar} alt={friend.name} className="h-[46px] w-[46px] rounded-full bg-gray-50 border-2 border-gray-100/50" />
                <div className={cn("absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[2.5px] border-white", friend.statusColor)} />
              </div>
              <div className="flex flex-col items-center w-full">
                <span className="text-[12px] font-bold text-gray-900 leading-tight w-full truncate text-center">{friend.name}</span>
                <span className="text-[9.5px] text-gray-400 font-semibold text-center leading-tight mt-1 w-[60px] truncate">{friend.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Find a Group CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[440px] z-30">
        <div className="relative flex items-center justify-between rounded-[24px] bg-gradient-to-r from-[#F4F1FF] to-[#EBE5FF] p-4 shadow-[0_12px_40px_rgba(99,102,241,0.2)] border border-white/60 backdrop-blur-xl">
          <div className="absolute -left-2 bottom-0 h-[85px] w-[85px] z-10 pointer-events-none drop-shadow-xl">
             <img src={roboImage} alt="Robot" className="h-full w-full object-contain object-bottom" />
          </div>
          <div className="pl-[70px] pr-2 flex-1 relative z-20">
            <h4 className="text-[14px] font-extrabold text-gray-900 leading-tight tracking-tight">Let's study together!</h4>
            <p className="text-[10px] text-gray-500 font-medium leading-[1.3] mt-1 max-w-[120px]">Focus more, learn better and achieve big.</p>
          </div>
          <button className="flex items-center gap-1.5 shrink-0 rounded-[18px] bg-[#A855F7] px-4 py-3 text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)] active:scale-95 transition-transform relative z-20">
            <Search className="h-4 w-4" strokeWidth={3} />
            <span className="text-[13px] font-bold">Find a group</span>
          </button>
        </div>
      </div>

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[320px] rounded-[28px] bg-white p-6 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowJoinModal(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="h-4 w-4 stroke-[3]" />
            </button>
            
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#F4F1FF] to-[#EBE5FF] text-[#6366F1] shadow-inner">
              <Users className="h-6 w-6 stroke-[2.5]" />
            </div>
            
            <h3 className="text-center text-[18px] font-extrabold text-gray-900 tracking-tight">Join Study Group</h3>
            <p className="mt-2 text-center text-[12px] font-medium text-gray-500 px-2 leading-snug">
              Enter the invite code from your friends to join their study space.
            </p>
            
            <div className="mt-6">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. SANA-XYZ"
                className="h-[52px] w-full rounded-[16px] border border-gray-200/80 bg-gray-50/50 px-4 text-center text-[16px] font-extrabold tracking-widest text-gray-900 placeholder:font-medium placeholder:tracking-normal placeholder:text-gray-400 focus:border-[#6366f1] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6366f1]/10 transition-all uppercase"
                autoFocus
              />
            </div>
            
            <button
              onClick={handleJoinSubmit}
              disabled={!joinCode.trim()}
              className={cn(
                "mt-4 flex w-full items-center justify-center rounded-[18px] py-3.5 text-[14px] font-bold transition-all",
                joinCode.trim() 
                  ? "bg-[#6366f1] text-white shadow-[0_4px_14px_rgba(99,102,241,0.35)] hover:opacity-90 active:scale-95 cursor-pointer" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
              )}
            >
              Join Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
