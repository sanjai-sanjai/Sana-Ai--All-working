import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState, useEffect, useRef, useCallback } from "react";
import { GroupAppBar } from "@/components/study-together/GroupAppBar";
import { TeamProgressOverview } from "@/components/study-together/TeamProgressOverview";
import { LiveMeetBanner } from "@/components/study-together/LiveMeetBanner";
import { MeetSummaryCard } from "@/components/study-together/MeetSummaryCard";
import { GroupChat, ChatMessage } from "@/components/study-together/GroupChat";
import { ChatComposer } from "@/components/study-together/ChatComposer";
import { BottomNavPills, TabType } from "@/components/study-together/BottomNavPills";
import { MyStudySpace } from "@/components/study-together/MyStudySpace";
import { ResourcesPanel, Resource } from "@/components/study-together/ResourcesPanel";
import { MembersPanel } from "@/components/study-together/MembersPanel";
import { AiCoachDashboard } from "@/components/study-together/AiCoachDashboard";
import { TeachingWorkspace } from "@/components/study-together/TeachingWorkspace";
import { EmbeddedMeeting } from "@/components/study-together/EmbeddedMeeting";
import { StudyTogetherRightSidebar } from "@/components/study-together/StudyTogetherRightSidebar";
import { useGroupMembers, useStudyGroups, useGroupMemberProfile, useSaveGroupMemberProfile, useMyStudyAssignment } from "@/hooks/use-study-groups";
import { useAuth } from "@/hooks/use-auth";
import { LearningProfileEditor, LearningProfile } from "@/components/study-together/LearningProfileEditor";
import { GroupSettingsPanel } from "@/components/study-together/GroupSettingsPanel";
import { ReassignTopicsModal } from "@/components/study-together/ReassignTopicsModal";
import { TopicDistributionGuide } from "@/components/study-together/TopicDistributionGuide";
import { useChat } from "@ai-sdk/react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/study-together/$groupId")({
  component: StudyGroupDetails,
});

const mockResources: Resource[] = [
  { id: '1', title: 'Binary Trees - Full Notes', type: 'pdf', uploaderName: 'Sanjai', sizeBytes: 2100000, createdAt: new Date().toISOString() },
];

function StudyGroupDetails() {
  const { groupId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const { data: groups, isPending: loadingGroups } = useStudyGroups(user?.id);
  const { data: members, isPending: loadingMembers } = useGroupMembers(groupId);
  const { data: myProfile, isPending: loadingProfile } = useGroupMemberProfile(groupId, user?.id);
  const { data: myAssignment } = useMyStudyAssignment(groupId, user?.id);
  const saveProfileMutation = useSaveGroupMemberProfile();
  
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [activeMeet, setActiveMeet] = useState<any>(null);
  const [meetTimer, setMeetTimer] = useState("00:00");
  const [showMeetSummary, setShowMeetSummary] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [reassignData, setReassignData] = useState<{ messageId: string, data: any } | null>(null);
  
  useEffect(() => {
    if (!groupId) return;
    const fetchStatus = () => {
      fetch(`/api/group-meet/status?groupId=${groupId}`)
        .then(res => res.json())
        .then(data => {
          if (data.meet) {
            if (data.meet.status === 'active') {
              setActiveMeet(data.meet);
              setShowMeetSummary(null);
            } else {
              setActiveMeet(null);
              setShowMeetSummary(data.meet);
            }
          }
        }).catch(console.error);
    };
    
    fetchStatus();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchStatus();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [groupId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeMeet && activeMeet.status === 'active') {
      interval = setInterval(() => {
        const start = new Date(activeMeet.started_at).getTime();
        const now = new Date().getTime();
        const diffSecs = Math.floor((now - start) / 1000);
        
        const hrs = Math.floor(diffSecs / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        const secs = diffSecs % 60;
        
        const pad = (n: number) => n.toString().padStart(2, '0');
        setMeetTimer(`${hrs > 0 ? pad(hrs) + ':' : ''}${pad(mins)}:${pad(secs)}`);
      }, 1000);
    } else {
      setMeetTimer("00:00");
    }
    return () => clearInterval(interval);
  }, [activeMeet]);

  const handleStartMeet = async () => {
    if (!groupId || !user?.id) return;
    
    if (activeMeet && activeMeet.status === 'active') {
      toast.info("A study session is already live. Joining now...");
      handleJoinMeet();
      return;
    }

    const toastId = toast.loading("Creating Google Meet...");
    
    try {
      const res = await fetch("/api/group-meet/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          userId: user.id,
          userName: members?.find((m: any) => m.user_id === user.id)?.profiles?.display_name
        })
      });
      const data = await res.json();
      if (data.meet) {
        toast.success("Study Session created successfully.", { id: toastId });
        setActiveMeet(data.meet);
        setActiveTab("meeting");
      }
    } catch (e) { 
      console.error(e); 
      toast.error("Failed to create meet.", { id: toastId });
    }
  };

  const handleJoinMeet = async () => {
    if (!activeMeet || !user?.id) return;
    try {
      await fetch("/api/group-meet/join", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           meetId: activeMeet.id,
           groupId,
           userId: user.id,
           userName: members?.find((m: any) => m.user_id === user.id)?.profiles?.display_name
         })
      });
      setActiveTab("meeting");
    } catch (e) { console.error(e); }
  };

  const handleEndMeet = async () => {
    if (!activeMeet || !groupId || !user?.id) return;
    const toastId = toast.loading("Ending meeting...");
    try {
      await fetch("/api/group-meet/end", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           meetId: activeMeet.id,
           groupId,
           userId: user.id
         })
      });
      toast.success("Meeting ended.", { id: toastId });
    } catch (e) { 
      console.error(e); 
      toast.error("Failed to end meeting.", { id: toastId });
    }
  };
  
  // Topic context for My Study Space
  const [topicContext, setTopicContext] = useState<{ id?: string; title: string; assignee: string } | null>(null);

  const handleAction = async (action: string, payload: any) => {
    if (action === 'start_learning') {
      setTopicContext(payload);
      setActiveTab('ai_workspace');
      if (groupId && user) {
        await (supabase as any).from('group_timeline').insert({
          group_id: groupId, user_id: user.id, action: `started learning ${payload.title}`
        });
      }
    } else if (action === 'approve_distribution') {
      const toastId = toast.loading("Approving plan...");
      try {
        const assignments = payload.assignments;
        if (!assignments || !assignments.length) throw new Error("No assignments to approve.");
        
        const inserts = assignments.map((a: any) => ({
          group_id: groupId,
          member_id: a.member_id,
          topic: a.title,
          subtopic: null,
          estimated_duration: a.estimated_time,
          reason: a.reason,
          assigned_by_ai: true,
          status: 'pending'
        }));

        // Simple approach: Delete existing pending assignments for this group and insert new ones
        await (supabase as any).from("study_assignments").delete().eq("group_id", groupId).eq("status", "pending");

        const { data: insertedAssignments, error } = await (supabase as any).from("study_assignments").insert(inserts).select();
        if (error) throw error;

        // Generate dummy roadmaps (or placeholders) for each assignment, as required
        if (insertedAssignments) {
           const roadmaps = insertedAssignments.map((a: any) => ({
             assignment_id: a.id,
             group_id: groupId,
             member_id: a.member_id,
             content: {
               steps: [
                 { title: "Introduction", status: "pending" },
                 { title: "Concept", status: "pending" },
                 { title: "Algorithm", status: "pending" },
                 { title: "Flowchart", status: "pending" },
                 { title: "Worked Example", status: "pending" },
                 { title: "Practice Problems", status: "pending" },
                 { title: "Revision", status: "pending" },
                 { title: "Quiz", status: "pending" },
                 { title: "Summary", status: "pending" }
               ]
             }
           }));
           await (supabase as any).from("study_roadmaps").insert(roadmaps);
        }

        toast.success("Study plan approved!", { id: toastId });
        
        // Broadcast realtime update for React Query
        queryClient.invalidateQueries({ queryKey: ["study_groups"] });

        // Update the AI chat message card immediately so everyone sees the new layout
        const approvedData = {
          type: "plan_approved",
          assignments: payload.assignments
        };

        const { error: updateError } = await (supabase as any)
          .from("study_group_messages")
          .update({
            content: "```json\n" + JSON.stringify(approvedData, null, 2) + "\n```",
            message_type: 'ai_plan_approved'
          })
          .eq("id", payload.messageId);
        
        if (updateError) throw updateError;
        
        // Insert Success AI message
        await (supabase as any).from("study_group_messages").insert({
          group_id: groupId,
          user_id: null,
          content: "Smart Study Plan Approved.\nEveryone's personalized learning workspace is now ready.\nEach member can begin learning from their assigned topic.",
          message_type: 'text'
        });

        // Optimistically update the UI so it transforms instantly
        setDbMessages(prev => prev.map(m => m.id === payload.messageId ? {
          ...m,
          content: "```json\n" + JSON.stringify(approvedData, null, 2) + "\n```",
          message_type: 'ai_plan_approved'
        } : m));

      } catch (e: any) {
        console.error(e);
        toast.error("Failed to approve plan: " + e.message, { id: toastId });
      }
    } else if (action === 'cancel_distribution') {
      toast("Topic distribution cancelled.");
    } else if (action === 'generate_distribution') {
      handleSendMessage("@Sana_AI Yes, please generate the smart topic distribution.", 'text');
    } else if (action === 'open_reassign') {
      setReassignData(payload);
    } else if (action === 'go_to_study_space') {
      setActiveTab('ai_workspace');
    }
  };

  const handleStartTeaching = (topicId: string, title: string) => {
    setTopicContext({ id: topicId, title, assignee: user?.id || '' });
    setActiveTab('teaching_workspace');
  };

  const handleSaveReassigned = async (newAssignments: any[]) => {
    if (!reassignData || !groupId || !user?.id) return;
    const { messageId, data } = reassignData;
    const toastId = toast.loading("Saving assignments...");
    
    try {
      // 1. Update the AI chat message card immediately so everyone sees the new layout
      const updatedData = { ...data, assignments: newAssignments };
      const newContent = "```json\n" + JSON.stringify(updatedData, null, 2) + "\n```";

      const { error: msgError } = await (supabase as any)
        .from("study_group_messages")
        .update({ content: newContent })
        .eq("id", messageId);
      
      if (msgError) throw msgError;

      // 2. If assignments are already pending/active in study_assignments, update them
      // However, usually "reassign" happens before "approve_plan". If so, just updating the chat card is enough.
      // But based on requirements: "Update study_assignments table, Update assignment history, Broadcast realtime event"
      
      // Let's assume we do a bulk upsert based on assignment topics for this group.
      const inserts = newAssignments.map((a: any) => {
        const member = members?.find((m: any) => m.profiles?.display_name?.trim().toLowerCase() === a.assigned_to?.trim().toLowerCase() || m.profiles?.username?.trim().toLowerCase() === a.assigned_to?.trim().toLowerCase());
        return {
          group_id: groupId,
          member_id: member?.user_id,
          topic: a.title,
          estimated_duration: a.estimated_time,
          reason: a.reason,
          assigned_by_ai: true,
          status: 'pending'
        };
      });

      // Simple approach: Delete existing pending assignments for this group and insert new ones
      await (supabase as any).from("study_assignments").delete().eq("group_id", groupId).eq("status", "pending");
      const { data: insertedAssignments, error: assignError } = await (supabase as any).from("study_assignments").insert(inserts).select();
      
      if (assignError) throw assignError;

      // Update history
      if (insertedAssignments) {
        await (supabase as any).from("assignment_history").insert(insertedAssignments.map((a: any) => ({
          assignment_id: a.id,
          changed_by: user.id,
          action: 'reassigned',
          details: { new_member: a.member_id }
        })));
      }

      toast.success("Topics reassigned successfully.", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["study_groups"] });
      setReassignData(null);
    } catch (e: any) {
      toast.error("Failed to save reassignments: " + e.message, { id: toastId });
    }
  };

  const handleApproveRedistribution = async (swap: any) => {
    if (!groupId || !user?.id) return;
    await fetch("/api/orchestrator-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "APPROVE_REDISTRIBUTION",
        groupId,
        adminId: user.id,
        payload: {
          topicId: swap.topicId,
          topicTitle: swap.topicTitle,
          toMemberId: swap.toMemberId,
          toMemberName: swap.toMember,
          fromMemberName: swap.fromMember
        }
      })
    });
    // Trigger an AI refresh so the orchestrator re-evaluates the load
    refreshAiCoach();
  };
  
  // Realtime Database Messages
  const [dbMessages, setDbMessages] = useState<ChatMessage[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isRefreshingCoach, setIsRefreshingCoach] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  const refreshAiCoach = async () => {
    if (!groupId) return;
    setIsRefreshingCoach(true);
    try {
      await fetch('/api/study-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId })
      });
      queryClient.invalidateQueries({ queryKey: ["study_groups"] });
    } finally {
      setIsRefreshingCoach(false);
    }
  };

  const group = groups?.find((g: any) => g.id === groupId);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatError, setChatError] = useState<Error | null>(null);

  // Fetch initial messages & subscribe to realtime

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from("study_group_messages")
        .select("*, profiles(display_name, avatar_url)")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });
        
      if (data) {
        const formatted = data.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          user_name: m.profiles?.display_name || (m.user_id === null ? "Sana AI" : "Unknown"),
          avatar_url: m.profiles?.avatar_url,
          content: m.content,
          message_type: m.message_type,
          file_url: m.file_url,
          file_name: m.file_name,
          file_size: m.file_size,
          created_at: m.created_at,
          is_mine: m.user_id === user?.id,
          is_ai: m.user_id === null,
          status: 'read' as const
        }));
        setDbMessages(formatted);
        scrollToBottom();
      }
    };
    
    fetchMessages();

    const channel = supabase.channel(`group-${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'study_group_messages', filter: `group_id=eq.${groupId}` }, async (payload) => {
        const { new: newMsg } = payload;
        
        let userName = "Unknown";
        let avatarUrl = null;
        if (newMsg.user_id === null) {
          userName = "Sana AI";
        } else if (newMsg.user_id) {
          const { data: profile } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", newMsg.user_id).single();
          userName = profile?.display_name || "Unknown";
          avatarUrl = profile?.avatar_url;
        }

        setDbMessages(prev => {
          // Deduplicate: if this message was already added optimistically (by matching content+user+close timestamp), update it
          const isDuplicate = prev.some(m => m.id === newMsg.id);
          if (isDuplicate) return prev;

          // Check if an optimistic version of this message exists (our own message sent moments ago)
          const optimisticIdx = prev.findIndex(m => 
            m.id.startsWith('optimistic-') && 
            m.user_id === newMsg.user_id && 
            m.content === newMsg.content
          );
          
          if (optimisticIdx !== -1) {
            // Replace optimistic message with the real one from DB
            const updated = [...prev];
            updated[optimisticIdx] = {
              id: newMsg.id,
              user_id: newMsg.user_id,
              user_name: userName,
              avatar_url: avatarUrl,
              content: newMsg.content,
              message_type: newMsg.message_type,
              file_url: newMsg.file_url,
              file_name: newMsg.file_name,
              file_size: newMsg.file_size,
              created_at: newMsg.created_at,
              is_mine: newMsg.user_id === user?.id,
              is_ai: newMsg.is_ai,
              status: 'read'
            };
            return updated;
          }
          
          // New message from another user or the system
          scrollToBottom();
          return [...prev, {
            id: newMsg.id,
            user_id: newMsg.user_id,
            user_name: userName,
            avatar_url: avatarUrl,
            content: newMsg.content,
            message_type: newMsg.message_type,
            file_url: newMsg.file_url,
            file_name: newMsg.file_name,
            file_size: newMsg.file_size,
            created_at: newMsg.created_at,
            is_mine: newMsg.user_id === user?.id,
            is_ai: newMsg.user_id === null,
            status: 'read'
          }];
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_assignments', filter: `group_id=eq.${groupId}` }, () => {
         queryClient.invalidateQueries({ queryKey: ["study_groups"] });
         queryClient.invalidateQueries({ queryKey: ["group-members"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_resources', filter: `group_id=eq.${groupId}` }, () => {
         queryClient.invalidateQueries({ queryKey: ["group-resources"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_group_meets', filter: `group_id=eq.${groupId}` }, (payload) => {
        const meet = payload.new as any;
        if (meet.status === 'active') {
          setActiveMeet(meet);
          setShowMeetSummary(null);
        } else if (meet.status === 'ended') {
          setActiveMeet(null);
          setShowMeetSummary(meet);
          queryClient.invalidateQueries({ queryKey: ["study_groups"] });
          queryClient.invalidateQueries({ queryKey: ["study-group-meeting"] });
          queryClient.invalidateQueries({ queryKey: ["group-chat"] });
        }
      })
      .subscribe();

    // Timeline fetch & realtime
    const fetchTimeline = async () => {
      const { data } = await (supabase as any).from('group_timeline')
        .select('*, profiles!user_id(display_name)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setTimeline(data);
    };
    fetchTimeline();

    const timelineChannel = supabase.channel(`timeline-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_timeline', filter: `group_id=eq.${groupId}` }, () => {
        fetchTimeline();
      })
      .subscribe();

    // Debounced AI Coach Trigger
    let timeoutId: NodeJS.Timeout;
    const progressChannel = supabase.channel(`progress-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progress_tracking', filter: `group_id=eq.${groupId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["group-members"] });
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => { refreshAiCoach(); }, 8000); // 8s debounce
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(timelineChannel);
      supabase.removeChannel(progressChannel);
      clearTimeout(timeoutId);
    };
  }, [groupId, user?.id]);

  // Auto-scroll when AI response streams in
  useEffect(() => {
    if (aiMessages?.some?.((m: any) => m.role === 'assistant') || isAiTyping) {
      scrollToBottom();
    }
  }, [aiMessages, isAiTyping, scrollToBottom]);

  const handleSendMessage = async (content: string, type: string = 'text', fileDetails?: { name: string, size: number }, fileUrl?: string) => {
    const isAiMention = content.includes("@Sana_AI");
    console.log("SENDING MESSAGE:", { content, isAiMention, type, fileUrl });
    
    // Optimistic ID so we can deduplicate when realtime fires
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // 1. Optimistically add message to chat immediately
    const optimisticMsg: ChatMessage & { file_url?: string } = {
      id: optimisticId,
      user_id: user?.id || null,
      user_name: 'You',
      avatar_url: null,
      content,
      message_type: type as any,
      file_url: fileUrl,
      created_at: new Date().toISOString(),
      is_mine: true,
      is_ai: false,
      status: 'sent'
    };
    setDbMessages(prev => [...prev, optimisticMsg as any]);
    scrollToBottom();

    // 2. If it's an AI mention, trigger Groq inference IMMEDIATELY (don't wait for DB)
    if (isAiMention) {
      setIsAiTyping(true);
      setChatError(null);
      setAiMessages([{ id: 'ai-temp', role: 'assistant', content: '' }]);

      // Trigger the fetch async so it doesn't block the optimistic UI rendering
      (async () => {
        try {
          const res = await fetch("/api/group-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content }],
              groupName: group?.name,
              groupSubject: group?.subject,
              members: members?.map((m: any) => ({
                name: m.profiles?.display_name || m.profiles?.username,
                role: m.role,
                strengths: m.strengths,
                weaknesses: [],
                learning_styles: m.learning_preferences
              })) || [],
              topics: []
            })
          });

          if (!res.ok) {
            throw new Error(await res.text());
          }

          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let fullResponse = "";

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              fullResponse += decoder.decode(value, { stream: true });
              setAiMessages([{ id: 'ai-temp', is_ai: true, role: 'assistant', content: fullResponse }]);
            }
          }

          if (!fullResponse.trim()) {
             console.error("AI RETURNED EMPTY RESPONSE! Full response was:", JSON.stringify(fullResponse));
             throw new Error("AI returned an empty response. Check backend logs.");
          }

          console.log("AI FULL RESPONSE RECEIVED:", fullResponse);

          let messageType: any = 'text';
          
          // Parse for JSON block
          const jsonMatch = fullResponse.match(/```json[\s\r\n]*([\s\S]*?)```/i);
          if (jsonMatch && jsonMatch[1]) {
             try {
               const parsed = JSON.parse(jsonMatch[1]);
               if (parsed.type === "topic_distribution") {
                 messageType = 'ai_distribution_proposal';
               } else if (parsed.type === "distribution_intent") {
                 messageType = 'ai_distribution_intent';
               }
             } catch (e) {
               console.error("Failed to parse AI JSON block", e);
             }
          }

          // On Finish: Save to DB
          const { data: aiInserted } = await (supabase as any).from("study_group_messages").insert({
            group_id: groupId,
            user_id: null,
            content: fullResponse,
            message_type: messageType
          }).select().single();

          if (aiInserted) {
            setDbMessages(prev => [...prev, {
              id: aiInserted.id,
              user_id: null,
              user_name: 'Sana AI',
              avatar_url: null,
              content: fullResponse,
              message_type: messageType,
              created_at: aiInserted.created_at,
              is_mine: false,
              is_ai: true,
              status: 'read'
            }]);
          }

          setAiMessages([]);
        } catch (err: any) {
          console.error("AI Error:", err);
          setChatError(err);
        } finally {
          setIsAiTyping(false);
        }
      })();
    }
    
    // 3. Save to DB in parallel (don't block AI response)
    (supabase as any).from("study_group_messages").insert({
      group_id: groupId,
      user_id: user?.id,
      content,
      message_type: type,
      file_url: fileUrl,
      file_name: fileDetails?.name,
      file_size: fileDetails?.size
    }).select().single().then(({ data: insertedMsg, error }: any) => {
      if (insertedMsg) {
        // Replace optimistic message with real one (update ID + status)
        setDbMessages(prev => prev.map(m => 
          m.id === optimisticId 
            ? { ...m, id: insertedMsg.id, status: 'delivered' as const }
            : m
        ));
      }
    });
  };

  if (loadingGroups || loadingMembers || loadingProfile) {
    return <div className="min-h-svh bg-background flex items-center justify-center font-bold">Loading group...</div>;
  }

  if (!group || !members) {
    return <div className="min-h-svh bg-background flex items-center justify-center font-bold">Group not found</div>;
  }

  const uiMembers = members.map((m: any) => ({
    id: m.user_id,
    name: m.profiles?.display_name || m.profiles?.username || "Unknown",
    progress_pct: m.progress_pct,
    is_online: m.is_online,
    is_you: m.user_id === user?.id,
    role: m.user_id === user?.id ? 'You' : (m.role === 'owner' ? 'Owner' : 'Member')
  }));

  // Merge DB messages and local AI streaming messages
  const streamingMessages = aiMessages.filter((m: any) => m.role === 'assistant').map((m: any) => ({
    id: m.id,
    user_id: null,
    user_name: 'Sana AI',
    content: m.content,
    message_type: 'text' as const,
    created_at: new Date().toISOString(),
    is_mine: false,
    is_ai: true,
    status: 'read' as const
  }));

  const allMessages = [...dbMessages, ...streamingMessages];

  const needsProfile = !myProfile?.completed_at;

  const handleSaveProfile = async (profileData: LearningProfile) => {
    if (!groupId || !user?.id) return;
    const toastId = toast.loading("Saving profile...");
    try {
      await saveProfileMutation.mutateAsync({
        group_id: groupId,
        user_id: user.id,
        ...profileData
      });
      toast.success("Profile saved!", { id: toastId });
    } catch (err: any) {
      toast.error("Failed to save profile: " + err.message, { id: toastId });
    }
  };

  if (needsProfile) {
    return (
      <div className="relative mx-auto flex h-svh w-full max-w-[480px] md:max-w-[880px] lg:max-w-[920px] flex-col bg-white overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] ring-1 ring-gray-200/60 md:rounded-[32px] p-6 pt-10 overflow-y-auto">
        <LearningProfileEditor 
          onSave={handleSaveProfile}
          initialProfile={myProfile ? { ...myProfile, teaching_preference: myProfile.teaching_preference || undefined } : undefined} 
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-svh w-full max-w-[480px] md:max-w-[880px] lg:max-w-[920px] flex-row bg-white overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] ring-1 ring-gray-200/60 md:rounded-l-[32px] md:rounded-r-[32px]">
      <div className="relative flex flex-col w-full max-w-[480px] h-full bg-white z-20 shrink-0">
        <GroupAppBar 
          groupId={groupId}
          groupName={group.name}
          memberCount={members?.length || 0}
          semester={group.semester || "General"}
          avatarUrl={group.avatar_url}
          isMeetActive={!!activeMeet}
          onMeetClick={() => {
            if (activeMeet) {
              setActiveTab("meeting" as any);
            } else {
              handleStartMeet();
            }
          }}
          onSettingsClick={() => setShowSettings(true)}
        />

      {activeTab === "meeting" && activeMeet && (
        <EmbeddedMeeting 
          roomUrl={activeMeet.meet_url}
          participantCount={Array.isArray(activeMeet.active_members) ? activeMeet.active_members.length : 1}
          onLeave={() => setActiveTab("chat")}
          onEnd={handleEndMeet}
          isCreator={activeMeet.created_by === user?.id || members?.find((m:any) => m.user_id === user?.id)?.role === 'owner'}
        />
      )}

      {showSettings && (
        <GroupSettingsPanel 
          group={group} 
          members={members} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      {activeTab === "chat" && (
        <div className="flex flex-1 flex-col overflow-hidden pb-[80px]">
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden pt-4 relative">
            <TeamProgressOverview 
              members={uiMembers} 
              onViewAll={() => navigate({ to: "/study-together/$groupId/team", params: { groupId } })} 
            />
            {activeMeet && (
              <LiveMeetBanner 
                startedBy={members?.find((m: any) => m.user_id === activeMeet.created_by)?.profiles?.display_name || "Member"}
                timeStarted={activeMeet.started_at}
                timerString={meetTimer}
                activeMembersCount={Array.isArray(activeMeet.active_members) ? activeMeet.active_members.length : 1}
                totalMembers={members?.length || 0}
                isCreator={activeMeet.created_by === user?.id || members?.find((m:any) => m.user_id === user?.id)?.role === 'owner'}
                onJoin={handleJoinMeet} 
                onEnd={handleEndMeet}
              />
            )}
            {!activeMeet && showMeetSummary && (
              <MeetSummaryCard
                 startedBy={members?.find((m: any) => m.user_id === showMeetSummary.created_by)?.profiles?.display_name || "Member"}
                 durationString={`${Math.floor((showMeetSummary.duration_seconds || 0) / 60)}m ${(showMeetSummary.duration_seconds || 0) % 60}s`}
                 participantCount={Array.isArray(showMeetSummary.active_members) ? showMeetSummary.active_members.length : 0}
                 onDismiss={() => setShowMeetSummary(null)}
              />
            )}
            
            <TopicDistributionGuide />

            <GroupChat 
              messages={allMessages} 
              isAiTyping={isAiTyping && streamingMessages.length === 0}
              onAction={handleAction}
              isMeetActive={!!activeMeet}
              members={uiMembers}
            />
          </div>
          <div className="absolute bottom-24 left-0 right-0 z-10 pointer-events-none">
            {chatError && (
              <div className="mx-4 my-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 shadow-md pointer-events-auto">
                <strong>AI Error:</strong> {chatError.message}
              </div>
            )}
          </div>
          <ChatComposer onSendMessage={handleSendMessage} />
          {reassignData && members && (
            <ReassignTopicsModal
              assignments={reassignData.data.assignments}
              members={members}
              onSave={handleSaveReassigned}
              onCancel={() => setReassignData(null)}
            />
          )}
        </div>
      )}

        {activeTab === "ai_workspace" ? (
          <div className="flex-1 overflow-hidden pt-[104px]">
            <MyStudySpace 
              topicContext={topicContext || (myAssignment ? { id: myAssignment.id, title: myAssignment.topic, assignee: user?.id || '' } : null)} 
              groupName={group.name} 
              onStartTeaching={handleStartTeaching}
            />
          </div>
        ) : activeTab === "teaching_workspace" && user ? (
          <div className="absolute inset-0 z-50 bg-background">
            <TeachingWorkspace 
              topicId={topicContext?.id || ''}
              topicTitle={topicContext?.title || ''}
              groupId={groupId}
              teacherId={user.id}
              onExit={() => setActiveTab('chat')}
            />
          </div>
        ) : activeTab === "resources" ? (
          <div className="flex-1 overflow-hidden pt-[104px]">
            <ResourcesPanel resources={mockResources} />
          </div>
        ) : activeTab === "plan" ? (
          <div className="flex flex-col gap-4 p-5 pb-32 pt-[104px] overflow-y-auto">
            <h2 className="text-[22px] font-bold text-gray-900 mb-2">Roadmap & Plan</h2>
            <p className="text-[14px] text-gray-500">Your syllabus and assignments will appear here.</p>
          </div>
        ) : activeTab === "dashboard" ? (
          <div className="flex-1 overflow-hidden pt-[104px]">
            <AiCoachDashboard 
              analytics={(group as any).analytics} 
              timeline={timeline}
              onRefreshAnalytics={refreshAiCoach}
              onApproveRedistribution={handleApproveRedistribution}
              isRefreshing={isRefreshingCoach}
            />
          </div>
        ) : null}

      {activeTab !== "teaching_workspace" && activeTab !== "meeting" && (
        <BottomNavPills activeTab={activeTab} onChange={setActiveTab} />
      )}
      </div>
      
      <StudyTogetherRightSidebar />
    </div>
  );
}
