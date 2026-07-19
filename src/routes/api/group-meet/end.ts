import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const Route = createFileRoute("/api/group-meet/end")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { meetId, groupId, userId } = await request.json();
          if (!meetId || !groupId) return new Response("Missing meetId or groupId", { status: 400 });

          // 1. Fetch current meet to calculate duration
          const { data: meet } = await supabase
            .from("study_group_meets")
            .select("*")
            .eq("id", meetId)
            .single();

          if (!meet) return new Response("Meet not found", { status: 404 });
          
          if (meet.status === 'ended') {
            return new Response(JSON.stringify({ success: true, meet }), {
              headers: { "Content-Type": "application/json" }
            });
          }

          // Calculate duration
          const startedAt = new Date(meet.started_at);
          const endedAt = new Date();
          const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
          
          // Format duration for the chat message
          const durationMins = Math.floor(durationSeconds / 60);
          const durationSecs = durationSeconds % 60;
          const durationStr = `${durationMins} Minutes ${durationSecs} Seconds`;
          
          const participantCount = Array.isArray(meet.active_members) ? meet.active_members.length : 1;

          // 2. Update meeting status
          const { data: updatedMeet } = await supabase
            .from("study_group_meets")
            .update({
              status: "ended",
              ended_at: endedAt.toISOString(),
              duration_seconds: durationSeconds
            })
            .eq("id", meetId)
            .select()
            .single();

          // 3. Broadcast meeting summary message
          await supabase.from("study_group_messages").insert({
            group_id: groupId,
            user_id: null,
            content: `Meeting Ended\n\nDuration: ${durationStr}\nParticipants: ${participantCount} Members`,
            message_type: "meet_end"
          });

          return new Response(JSON.stringify({ success: true, meet: updatedMeet }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          console.error("group-meet/end error", err);
          return new Response(`Error: ${err instanceof Error ? err.message : 'Unknown'}`, { status: 500 });
        }
      }
    }
  }
});
