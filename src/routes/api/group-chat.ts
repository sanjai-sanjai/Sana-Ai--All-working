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
If the user uploads a syllabus, or explicitly asks you to generate a study roadmap or distribute topics:
1. Actively analyze who should learn what based on their 'Strengths' and 'Learning Style'.
2. Provide motivational guidance.
3. ALWAYS output the actual assignments using this EXACT Markdown fenced block format (the frontend uses this to generate interactive UI cards):

\`\`\`assignments
Title | Assigned To (Exact Name) | Estimated Time | Difficulty (Easy/Medium/Hard)
Sorting Algorithms | Hari | 2h | Medium
Time Complexity | Akash | 1h | Hard
\`\`\`

Rules for \`assignments\` block:
- Use EXACTLY this header format or pipe-separated lines.
- Only assign topics to the exact names of the team members listed above.
- Do NOT output this block unless specifically asked to distribute topics or make a roadmap.

Do not dump raw JSON. Keep responses concise unless asked to explain deeply.`;

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
