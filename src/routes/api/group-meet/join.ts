import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const Route = createFileRoute("/api/group-meet/join")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { meetId, userId, userName, groupId } = await request.json();
          if (!meetId || !userId) return new Response("Missing meetId or userId", { status: 400 });

          // 1. Fetch current meet
          const { data: meet } = await supabase
            .from("study_group_meets")
            .select("active_members")
            .eq("id", meetId)
            .single();

          if (!meet) return new Response("Meet not found", { status: 404 });

          // 2. Add user to active_members if not already there
          const currentMembers = Array.isArray(meet.active_members) ? meet.active_members : [];
          if (!currentMembers.includes(userId)) {
            const updatedMembers = [...currentMembers, userId];
            await supabase
              .from("study_group_meets")
              .update({ active_members: updatedMembers })
              .eq("id", meetId);

            // 3. Broadcast join event (lightweight activity message)
            await supabase.from("study_group_messages").insert({
              group_id: groupId,
              user_id: null,
              content: `${userName || "Someone"} joined the Meet`,
              message_type: "meet_join"
            });
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          console.error("group-meet/join error", err);
          return new Response(`Error: ${err instanceof Error ? err.message : 'Unknown'}`, { status: 500 });
        }
      }
    }
  }
});
