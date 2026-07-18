import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, smoothStream, streamText, type UIMessage } from "ai";
import { getGroqModel } from "@/lib/ai-groq.server";
import { systemPromptFor, type AiPersonality } from "@/lib/sana";

type GroupMemberProfile = {
  name: string;
  role: string;
  strengths: string[];
  weaknesses: string[];
  learning_styles: string[];
};

type Body = {
  messages?: UIMessage[];
  personality?: AiPersonality;
  groupName: string;
  groupSubject: string;
  members: GroupMemberProfile[];
  topics: any[]; // Existing roadmap topics
};

export const Route = createFileRoute("/api/group-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages, personality, groupName, groupSubject, members, topics } =
            (await request.json()) as Body;
          console.log("GROUP CHAT API HIT:", messages);
            
          if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });

          // Base persona from Sana
          const baseSystem = systemPromptFor(personality ?? "friendly_coach", "Team");

          // Group Collaboration Instructions
          let system = `${baseSystem}

## GROUP ASSISTANT MODE
You are acting as a collaborative teacher and AI mentor for a study group called "${groupName}" studying "${groupSubject}".
You are chatting in a group channel. Treat this like a WhatsApp group chat.
When you answer, consider the whole team. Address members by their names.
Motivate, assign tasks, and encourage peer learning (e.g. "Hari, you are strong in Programming, please help Akash with this!").

### Team Members Profile
${(members || []).map(m => {
  const strengths = Array.isArray(m.strengths) ? m.strengths.join(", ") : (m.strengths || "Unknown");
  const weaknesses = Array.isArray(m.weaknesses) ? m.weaknesses.join(", ") : (m.weaknesses || "Unknown");
  const learningStyles = Array.isArray(m.learning_styles) ? m.learning_styles.join(", ") : (m.learning_styles || "Unknown");
  
  return `- **${m.name || 'Unknown'}** (${m.role || 'Member'}):
  Strengths: ${strengths}
  Needs Improvement: ${weaknesses}
  Learning Style: ${learningStyles}`;
}).join("\n")}

### Current Roadmap / Assigned Topics
${(topics || []).length > 0 ? (topics || []).map(t => `- [${t.status}] ${t.title} (Assigned to: ${t.assigned_to_name})`).join("\n") : "No topics assigned yet."}

## SYLLABUS UNDERSTANDING & TOPIC DISTRIBUTION
If the user uploads a syllabus, or explicitly asks you to generate a study roadmap or distribute topics, follow this TWO-STEP process:

STEP 1: INTENT & CONFIRMATION
Do NOT immediately assign topics. First, analyze the uploaded material or request, identify the learning components.
IMPORTANT OVERRIDE: Do NOT output a \`roadmap\` block or a \`chips\` block. You MUST instead output a single JSON block wrapped in triple backticks exactly like this:
\`\`\`json
{
  "type": "distribution_intent",
  "chapter": "Identified Chapter/Unit Name",
  "intro_text": "I can help organize your study for [Chapter]. I'll analyze the material and distribute topics based on each member's strengths, learning style, and preferences.\\n\\nShall I create a smart topic distribution for the team?"
}
\`\`\`

STEP 2: SMART DISTRIBUTION PROPOSAL
Only AFTER the group explicitly agrees (e.g., "Yes", "Go ahead", "Assign them"), you must generate the Smart Topic Distribution.
IMPORTANT OVERRIDE: Do NOT output a \`roadmap\` block. When generating the distribution, you MUST output a JSON block wrapped in triple backticks with "json" as the language.
The JSON must perfectly match this structure:

\`\`\`json
{
  "type": "topic_distribution",
  "chapter": "Chapter/Topic Name",
  "assignments": [
    {
      "title": "Topic Name",
      "assigned_to": "Exact Name of Team Member",
      "estimated_time": "1h 30m",
      "difficulty": "Medium",
      "reason": "Brief reason based on their profile score"
    }
  ]
}
\`\`\`

Rules for the JSON block:
- Use EXACTLY this JSON structure.
- Only assign topics to the exact names of the team members listed above.
- Ensure the JSON is valid and parsable.
- Provide a brief "reason" why this member is the best match.
- Do not output this block unless specifically asked to distribute topics AFTER they have agreed.`;

          const model = getGroqModel();
          const result = streamText({
            model,
            system,
            messages: messages.map((m: any) => ({ role: m.role, content: m.content || "" })),
            abortSignal: request.signal,
          });
          
          return result.toTextStreamResponse({
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              "X-Accel-Buffering": "no",
              Connection: "keep-alive",
            },
          });
        } catch (err) {
          console.error("group chat api error", err);
          const msg = err instanceof Error ? err.message : "unknown error";
          return new Response(`AI error: ${msg}`, { status: 500 });
        }
      },
    },
  },
});
