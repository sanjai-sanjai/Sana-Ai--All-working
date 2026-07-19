import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, smoothStream, streamText, type UIMessage } from "ai";
import { getGroqModel } from "@/lib/ai-groq.server";

type Body = {
  messages?: UIMessage[];
  studentName: string;
  topicTitle: string;
  groupName: string;
  progressPct: number;
  activeNode?: {
    title: string;
    description: string;
    type: string;
  };
};

export const Route = createFileRoute("/api/study-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages, studentName, topicTitle, groupName, progressPct, activeNode } =
            (await request.json()) as Body;
            
          if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });

          const system = `You are Sana, a highly intelligent and specialized AI Personal Mentor guiding a study session.
Student: ${studentName}
Topic: ${topicTitle}
Group: ${groupName}
Current Mastery: ${progressPct}%

${activeNode ? `
### CURRENT MISSION CHECKPOINT
You are currently guiding the student through this specific checkpoint on their personalized roadmap:
- **Phase**: ${activeNode.title} (${activeNode.type})
- **Focus**: ${activeNode.description}

Do NOT jump ahead to other topics. Keep your responses strictly focused on fulfilling this current checkpoint.
` : `You are currently introducing the topic.`}

### THE MENTORSHIP STYLE
1. **Act as a Coach, not ChatGPT**: Say things like "I noticed you're doing great...", "Let's increase the difficulty...", "Let's break this down...".
2. **Interactive**: End every message with a question or a "Mini Check". Wait for the student to answer. Do not give away the answer immediately.
3. **Adaptability**: If they struggle, break it down into micro-lessons. If they excel, push them.

### MARKDOWN & VISUALS
Use rich formatting:
- \`\`\`mermaid\`\`\` for knowledge graphs or flowcharts.
- Tables for comparisons.
- Callouts (\`> [!TIP]\`) for memory tricks or important notes.

### LIVE NOTES GENERATION
Continuously generate summary notes during your teaching. 
Output them in a dedicated block:
\`\`\`notes
- Important point 1
- Definition of X
\`\`\`
The frontend will parse this block. Do not include introductory text for the notes block.

Keep your responses conversational, highly motivating, and focused on the current checkpoint.`;

          const model = getGroqModel();
          const result = streamText({
            model,
            system,
            messages: messages.map((m: any) => {
              const text = m.parts?.map((p: any) => p.type === "text" ? p.text : "").join("") || m.content || "";
              return { role: m.role, content: text };
            }),
            abortSignal: request.signal,
            experimental_transform: smoothStream({ delayInMs: 10 }),
          });
          
          return result.toUIMessageStreamResponse({
            originalMessages: messages,
            sendReasoning: false,
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              "X-Accel-Buffering": "no",
              Connection: "keep-alive",
            },
          });
        } catch (err) {
          console.error("study-session api error", err);
          const msg = err instanceof Error ? err.message : "unknown error";
          return new Response(`AI error: ${msg}`, { status: 500 });
        }
      },
    },
  },
});
