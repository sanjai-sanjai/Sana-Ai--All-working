import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const Route = createFileRoute("/api/group-meet/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const groupId = url.searchParams.get("groupId");
          
          if (!groupId) return new Response("Missing groupId", { status: 400 });

          const { data: meet } = await supabase
            .from("study_group_meets")
            .select("*")
            .eq("group_id", groupId)
            .order("started_at", { ascending: false })
            .limit(1)
            .single();

          // Even if it's ended, we return the last meet so we can display the summary
          return new Response(JSON.stringify({ success: true, meet: meet || null }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          console.error("group-meet/status error", err);
          return new Response(`Error: ${err instanceof Error ? err.message : 'Unknown'}`, { status: 500 });
        }
      }
    }
  }
});
