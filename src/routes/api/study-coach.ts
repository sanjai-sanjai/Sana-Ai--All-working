import { createFileRoute } from "@tanstack/react-router";
import { generateObject } from "ai";
import { z } from "zod";
import { getGroqModel } from "@/lib/ai-groq.server";
import { createClient } from "@supabase/supabase-js";

// We need a service role client to bypass RLS and update the analytics column
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const Route = createFileRoute("/api/study-coach")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { groupId } = await request.json();
          if (!groupId) return new Response("groupId required", { status: 400 });

          // 1. Fetch entire group state
          const [
            { data: group },
            { data: members },
            { data: topics },
            { data: timeline }
          ] = await Promise.all([
            supabase.from("study_groups").select("*").eq("id", groupId).single(),
            supabase.from("study_group_members").select("*, profiles(display_name, username)").eq("group_id", groupId),
            supabase.from("study_group_topics").select("*, assigned_user:profiles!assigned_to(display_name, username)").eq("group_id", groupId),
            supabase.from("group_timeline").select("*, profiles!user_id(display_name, username)").eq("group_id", groupId).order("created_at", { ascending: false }).limit(20)
          ]);

          if (!group) return new Response("Group not found", { status: 404 });

          // 2. Prepare context for AI
          const context = `
          Group Name: ${group.name}
          Subject: ${group.subject}
          
          Members:
          ${members?.map(m => `- ${m.user_id} (${(m.profiles as any)?.display_name}): Progress ${m.progress_pct}% (Online: ${m.is_online})`).join("\n")}
          
          Topics (Syllabus):
          ${topics?.map(t => `- ID: ${t.id} | ${t.title} [Diff: ${t.difficulty}] (Assigned to: ${t.assigned_to || 'None'} / ${(t.assigned_user as any)?.display_name || 'Unassigned'}) - Progress: ${t.progress_pct}% - Status: ${t.status}`).join("\n")}
          
          Recent Timeline Events:
          ${timeline?.map(t => `- ${(t.profiles as any)?.display_name} ${t.action} at ${t.created_at}`).join("\n")}
          `;

          // 3. Generate AI Coach Insights
          const model = getGroqModel();
          const { object } = await generateObject({
            model,
            system: "You are a Senior AI Study Orchestrator managing a collaborative study group. You must coordinate workloads, predict exam readiness, calculate health scores, and act as a project manager.",
            prompt: `Analyze the following study group and return the JSON state: \n\n${context}`,
            schema: z.object({
              overviewMessage: z.string().describe("A welcoming overview greeting to the team, highlighting overall completion and any major events."),
              teamHealth: z.enum(["Excellent", "Good", "Needs Attention", "Critical"]).describe("Overall health of the team's progress and activity."),
              teamReadiness: z.number().min(0).max(100).describe("A calculated readiness score from 0-100 based on topic completion and activity."),
              examReadiness: z.object({
                confidenceScore: z.number().min(0).max(100).describe("Confidence in passing exams."),
                estimatedCompletionDate: z.string().describe("E.g., '3 Days Before Exam' or 'Mid-November'"),
                highRiskTopics: z.array(z.string()).describe("Topics that are falling behind or have low quiz scores.")
              }),
              memberHealth: z.array(z.object({
                name: z.string(),
                status: z.enum(["Healthy", "Needs Revision", "Inactive", "Falling Behind", "Busy", "Vacation Mode"]),
                reason: z.string()
              })).describe("Health status for every member."),
              weakMembers: z.array(z.object({
                name: z.string(),
                currentProgress: z.number(),
                expectedProgress: z.number(),
                recommendation: z.string()
              })).describe("Identify members who are falling behind the average and need intervention."),
              redistributions: z.array(z.object({
                topicId: z.string().optional(),
                topicTitle: z.string(),
                fromMemberId: z.string().optional(),
                fromMember: z.string(),
                toMemberId: z.string().optional(),
                toMember: z.string(),
                reason: z.string()
              })).describe("Suggest topic reassignments if someone is overloaded or inactive. Provide exact IDs if available in context."),
              loadBalancer: z.array(z.object({
                warning: z.string(),
                suggestion: z.string()
              })).describe("Detect uneven workloads (e.g. Hari 8 topics, Akash 2 topics) and suggest balance."),
              dailyPlan: z.array(z.object({
                memberName: z.string(),
                task: z.string()
              })).describe("Actionable daily study mission for each active member."),
              smartReminders: z.array(z.object({
                title: z.string(),
                message: z.string()
              })).describe("Context-aware reminders (e.g., timezone, deadlines, habits)."),
              insights: z.array(z.string()).describe("2-3 high-level analytical observations about the team's learning patterns."),
              revisionTargets: z.array(z.string()).describe("Topics that are completed but should be revised soon."),
              smartMotivation: z.string().describe("A highly contextual, motivating message specific to their exact situation right now.")
            })
          });

          // 4. Save to Database
          await supabase.from("study_groups").update({
            analytics: object
          }).eq("id", groupId);

          return new Response(JSON.stringify(object), {
            headers: { "Content-Type": "application/json" }
          });

        } catch (err) {
          console.error("study-coach api error", err);
          return new Response(`AI Coach Error: ${err instanceof Error ? err.message : 'Unknown'}`, { status: 500 });
        }
      }
    }
  }
});
