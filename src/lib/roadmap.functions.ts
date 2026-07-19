import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateObject } from "ai";
import { getGroqModel } from "@/lib/ai-groq.server";

const ProfileContextSchema = z.object({
  topicTitle: z.string(),
  studentName: z.string(),
  learningStyle: z.string().optional(),
  strongSkills: z.string().optional(),
  weakSkills: z.string().optional(),
});

export const generateMissionRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileContextSchema.parse(d))
  .handler(async ({ data }) => {
    try {
      const model = getGroqModel();
      let result;
      try {
        result = await generateObject({
          model,
          schema: z.object({
            mission: z.object({
              estimatedTime: z.string(),
              difficulty: z.string(),
              expectedOutcome: z.string(),
              confidenceGoal: z.string(),
            }),
            roadmap: z.array(z.object({
              id: z.string(),
              title: z.string(),
              type: z.enum(["concept", "visual", "example", "practice", "quiz", "teach", "summary"]),
              description: z.string(),
              resources: z.array(z.object({
                title: z.string(),
                type: z.enum(["pdf", "video", "article", "flashcard"]),
              })).optional(),
            })),
          }),
          prompt: `You are Sana AI, an expert educational architect. 
          Create a personalized learning mission and interactive roadmap for ${data.studentName} learning "${data.topicTitle}".
          Their learning style: ${data.learningStyle || 'mixed'}
          Strong skills: ${data.strongSkills || 'none'}
          Weak skills: ${data.weakSkills || 'none'}
          
          Generate:
          1. A high-level mission brief (estimatedTime like "2h 30m", difficulty like "Advanced", confidenceGoal like "90%").
          2. A step-by-step roadmap tailored to their profile. Include 6-10 steps ranging from concept overviews to practice quizzes and a final challenge. 
          
          Ensure the roadmap directly addresses their weak skills and leverages their strong skills. Never use templates, make it unique.`
        });
        return result.object;
      } catch (aiError) {
        console.error("AI Generation failed, using fallback:", aiError);
        return {
          mission: {
            estimatedTime: "2h 00m",
            difficulty: "Intermediate",
            expectedOutcome: "Master the fundamentals of " + data.topicTitle,
            confidenceGoal: "85%",
          },
          roadmap: [
            { id: "1", title: "Introduction & Concepts", type: "concept", description: "Understand the core ideas behind " + data.topicTitle },
            { id: "2", title: "Visual Breakdown", type: "visual", description: "See how the components connect." },
            { id: "3", title: "Interactive Practice", type: "practice", description: "Apply what you learned in a hands-on exercise." },
            { id: "4", title: "Final Knowledge Check", type: "quiz", description: "Test your understanding to complete the mission." },
          ]
        };
      }
    } catch (e: any) {
      console.error(e);
      throw new Error("Failed to generate roadmap: " + e.message);
    }
  });
