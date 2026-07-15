import { createFileRoute } from "@tanstack/react-router";
import { generateObject } from "ai";
import { z } from "zod";
import { getGroqModel } from "@/lib/ai-groq.server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const Route = createFileRoute("/api/teach-prep")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { topicId, teacherId, groupId } = await request.json();
          if (!topicId || !teacherId) return new Response("Missing parameters", { status: 400 });

          const { data: topic } = await supabase.from("study_group_topics").select("*").eq("id", topicId).single();
          if (!topic) return new Response("Topic not found", { status: 404 });

          const model = getGroqModel();
          const { object } = await generateObject({
            model,
            system: "You are a Master Educator AI. You must help a student prepare to teach their teammates. Generate structured presentation content, speaker notes, expected questions, and a whiteboard flowchart.",
            prompt: `Topic: ${topic.title}\nDifficulty: ${topic.difficulty}\n\nGenerate the complete teaching payload.`,
            schema: z.object({
              teachingPlan: z.object({
                estimatedMinutes: z.number().describe("Estimated duration of the teaching session in minutes (e.g., 10)."),
                learningObjectives: z.array(z.string()).describe("3 main things teammates will learn.")
              }),
              presentation: z.array(z.object({
                slideNumber: z.number(),
                title: z.string(),
                content: z.string().describe("Markdown content for the slide. Use code blocks, tables, and bullet points.")
              })).describe("Generate 5-7 slides covering introduction, core concept, examples, and summary."),
              whiteboard: z.string().describe("A Mermaid.js syntax flowchart, tree, or graph that visually explains the core concept of the topic."),
              expectedQuestions: z.array(z.object({
                question: z.string(),
                answer: z.string()
              })).describe("4 common questions teammates might ask, and how to answer them concisely."),
              speakerNotes: z.array(z.object({
                slideNumber: z.number(),
                note: z.string().describe("What the student should literally say while presenting this slide. Make it engaging.")
              })).describe("Speaker notes mapping to each slide.")
            })
          });

          // Insert into teaching_materials
          const { data: material } = await supabase.from("teaching_materials").insert({
            group_id: groupId,
            topic_id: topicId,
            teacher_id: teacherId,
            structured_content: object
          }).select().single();

          return new Response(JSON.stringify({ materialId: material?.id, ...object }), {
            headers: { "Content-Type": "application/json" }
          });

        } catch (err) {
          console.error("teach-prep api error", err);
          return new Response(`Error: ${err instanceof Error ? err.message : 'Unknown'}`, { status: 500 });
        }
      }
    }
  }
});
