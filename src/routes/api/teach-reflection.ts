import { createFileRoute } from "@tanstack/react-router";
import { generateObject } from "ai";
import { z } from "zod";
import { getGroqModel } from "@/lib/ai-groq.server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const Route = createFileRoute("/api/teach-reflection")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { sessionId } = await request.json();
          if (!sessionId) return new Response("sessionId required", { status: 400 });

          // 1. Fetch teaching session & feedback
          const { data: session } = await supabase.from("teaching_sessions").select("*, study_group_topics(title)").eq("id", sessionId).single();
          const { data: feedbacks } = await supabase.from("teaching_feedback").select("rating, comment").eq("session_id", sessionId);

          if (!session) return new Response("Session not found", { status: 404 });

          // 2. Generate AI Reflection
          const model = getGroqModel();
          const { object } = await generateObject({
            model,
            system: "You are a Master Educator AI analyzing peer feedback for a student teacher. Generate constructive, highly encouraging feedback to help them improve their teaching skills.",
            prompt: `Topic Taught: ${(session.study_group_topics as any)?.title}\nDuration: ${session.duration_seconds} seconds\n\nPeer Feedbacks:\n${feedbacks?.map(f => `- Rating: ${f.rating}, Comment: ${f.comment}`).join('\n') || 'No feedback provided.'}`,
            schema: z.object({
              strengths: z.array(z.string()).describe("3 things the student did really well based on feedback."),
              areasToImprove: z.array(z.string()).describe("2 constructive areas for improvement."),
              confidenceScore: z.number().min(0).max(100).describe("An estimated confidence score (0-100) based on feedback."),
              communicationTips: z.string().describe("A short paragraph offering actionable communication advice.")
            })
          });

          return new Response(JSON.stringify(object), {
            headers: { "Content-Type": "application/json" }
          });

        } catch (err) {
          console.error("teach-reflection api error", err);
          return new Response(`Error: ${err instanceof Error ? err.message : 'Unknown'}`, { status: 500 });
        }
      }
    }
  }
});
