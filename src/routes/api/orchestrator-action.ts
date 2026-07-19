import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const Route = createFileRoute("/api/orchestrator-action")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { action, payload, groupId, adminId } = await request.json();
          if (!groupId || !adminId) return new Response("Missing group or admin id", { status: 400 });

          // Verify admin
          const { data: admin } = await supabase.from("study_group_members").select("role").eq("group_id", groupId).eq("user_id", adminId).single();
          if (admin?.role !== "owner") {
            return new Response("Unauthorized. Only the group owner can approve redistributions.", { status: 403 });
          }

          if (action === "APPROVE_REDISTRIBUTION") {
            const { topicId, toMemberId, topicTitle, toMemberName, fromMemberName } = payload;
            
            if (!topicId || !toMemberId) return new Response("Missing assignment targets", { status: 400 });

            // 1. Reassign Topic
            await supabase.from("study_group_topics").update({
              assigned_to: toMemberId
            }).eq("id", topicId);

            // 2. Add Timeline Event
            await supabase.from("group_timeline").insert({
              group_id: groupId,
              user_id: adminId, // The admin who approved it
              action: `approved AI redistribution: Reassigned ${topicTitle} from ${fromMemberName} to ${toMemberName}`
            });

            return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
          }

          return new Response("Unknown action", { status: 400 });
        } catch (err) {
          console.error("orchestrator-action error", err);
          return new Response(`Error: ${err instanceof Error ? err.message : 'Unknown'}`, { status: 500 });
        }
      }
    }
  }
});
