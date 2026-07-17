import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const Route = createFileRoute("/api/group-meet/start")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { groupId, userId, userName } = await request.json();
          if (!groupId || !userId) return new Response("Missing groupId or userId", { status: 400 });

          // 1. Check if an active meeting already exists
          const { data: existingMeet } = await supabase
            .from("study_group_meets")
            .select("*")
            .eq("group_id", groupId)
            .eq("status", "active")
            .single();

          if (existingMeet) {
            return new Response(JSON.stringify({ success: true, meet: existingMeet }), {
              headers: { "Content-Type": "application/json" }
            });
          }

          // 2. Generate a Jitsi Meet URL as a deterministic substitute for Google Meet
          const roomId = `sana-study-${groupId.substring(0, 8)}-${Date.now()}`;
          const meetUrl = `https://jitsi.riot.im/${roomId}`;

          // 3. Create the new meeting record
          const { data: newMeet, error: insertError } = await supabase
            .from("study_group_meets")
            .insert({
              group_id: groupId,
              created_by: userId,
              room_id: roomId,
              meet_url: meetUrl,
              status: "active",
              active_members: [userId]
            })
            .select()
            .single();

          if (insertError) {
            console.error("Failed to insert meeting:", insertError);
            return new Response("Unable to create meeting. Please try again.", { status: 500 });
          }

          // 4. Broadcast a system message to the chat
          await supabase.from("study_group_messages").insert({
            group_id: groupId,
            user_id: null,
            content: `🎥 ${userName || "A member"} started a Study Session.\n\nJoin the discussion now.`,
            message_type: "meet_start"
          });

          return new Response(JSON.stringify({ success: true, meet: newMeet }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          console.error("group-meet/start error", err);
          return new Response(`Error: ${err instanceof Error ? err.message : 'Unknown'}`, { status: 500 });
        }
      }
    }
  }
});
