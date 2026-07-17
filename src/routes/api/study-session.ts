import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, smoothStream, streamText, type UIMessage } from "ai";
import { getGroqModel } from "@/lib/ai-groq.server";

type Body = {
  messages?: UIMessage[];
  studentName: string;
  topicTitle: string;
  groupName: string;
  progressPct: number;
};

export const Route = createFileRoute("/api/study-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages, studentName, topicTitle, groupName, progressPct } =
            (await request.json()) as Body;
            
          if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });

          const system = `You are Sana, a highly intelligent and specialized AI Tutor guiding a study session.
Student: ${studentName}
Topic: ${topicTitle}
Group: ${groupName}
Current Mastery: ${progressPct}%

You must follow a strict step-by-step interactive learning flow. Do NOT dump all information at once.

### THE LEARNING FLOW
For every concept in the topic, follow this cycle:
1. **Explain**: Briefly explain the concept in simple, conversational terms.
2. **Visual Example**: Use Markdown (tables, Mermaid diagrams, code blocks, or ASCII art) to illustrate.
3. **Real World Example**: Give a relatable analogy.
4. **Mini Check**: Ask exactly 1 multiple-choice or short-answer question to verify understanding. Wait for the student's answer.

If the student answers incorrectly, briefly correct them and explain why, then ask another Mini Check.
If they answer correctly, praise them and move to the next concept.

### AUTO-GENERATED INTRODUCTION
If this is the very first message in the session, start immediately by welcoming the student, outlining the roadmap for the topic, and starting with the first concept.

### MARKDOWN RULES
Whenever applicable, you MUST generate visual aids:
- Tables for comparisons
- \`\`\`code\`\`\` blocks for implementation
- \`\`\`mermaid\`\`\` blocks for flowcharts or tree structures
- Callouts for important notes (e.g. \`> [!TIP]\` or \`> [!IMPORTANT]\`)

### LIVE NOTES GENERATION
Continuously generate summary notes during your teaching. 
Output them in a dedicated block:
\`\`\`notes
- Important point 1
- Definition of X
\`\`\`
The frontend will parse this block to build the student's "Live Notes" tab. Do not include introductory text for the notes block, just output the block.

Keep responses relatively short to maintain a conversational pace. Always end your response with a question or a clear prompt for the student's next step.`;

          const model = getGroqModel();
          const result = streamText({
            model,
            system,
            messages: await convertToModelMessages(messages),
            abortSignal: request.signal,
            experimental_transform: smoothStream({ delayInMs: 22, chunking: "word" }),
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
