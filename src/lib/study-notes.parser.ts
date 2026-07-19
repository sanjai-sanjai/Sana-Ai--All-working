import type { NotebookDoc, NotebookBlock } from "./study-notes.schema";

export function parseMarkdownToNotebookDoc(topic: string, markdown: string): NotebookDoc {
  const cleanTopic = (topic || "Study Notes").replace(/^["'\s]+|["'\s]+$/g, "");
  
  if (!markdown || !markdown.trim()) {
    return {
      title: cleanTopic.slice(0, 80),
      subtitle: null,
      blocks: [
        { kind: "section", text: "Notes" },
        { kind: "paragraph", text: "No content available." },
      ],
    };
  }

  const blocks: NotebookBlock[] = [];
  const lines = markdown.split("\n");
  
  let currentList: string[] = [];
  let listType: "checklist" | "revision" | "mistake" = "revision";
  let inCodeBlock = false;
  let codeLang = "";
  let codeBuffer: string[] = [];

  function flushList() {
    if (currentList.length > 0) {
      blocks.push({ kind: listType, items: [...currentList] });
      currentList = [];
      listType = "revision";
    }
  }

  function flushCode() {
    if (codeBuffer.length > 0) {
      blocks.push({
        kind: "code",
        language: codeLang || "javascript",
        filename: null,
        code: codeBuffer.join("\n"),
        output: null,
        explanation: null,
      });
      codeBuffer = [];
      codeLang = "";
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Code block toggle ```
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCode();
      } else {
        flushList();
        inCodeBlock = true;
        codeLang = line.replace(/```/, "").trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    if (!line) {
      flushList();
      continue;
    }

    // Headings (# Heading, ## Heading, ### Heading)
    if (line.startsWith("#")) {
      flushList();
      const headingText = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
      
      if (/common mistakes|mistakes|pitfalls/i.test(headingText)) {
        listType = "mistake";
      } else if (/revision|summary|key points|takeaway/i.test(headingText)) {
        listType = "revision";
      } else if (/checklist|steps|tasks/i.test(headingText)) {
        listType = "checklist";
      }
      
      blocks.push({ kind: "section", text: headingText || "Section" });
      continue;
    }

    // Callouts (> Note: ..., > Warning: ..., > Remember: ...)
    if (line.startsWith(">")) {
      flushList();
      const calloutText = line.replace(/^>\s*/, "").replace(/\*\*/g, "").trim();
      if (/warning|caution|alert|error/i.test(calloutText)) {
        blocks.push({ kind: "warning", text: calloutText.replace(/^(warning|caution|alert|error):?\s*/i, "") });
      } else if (/remember|memory|mnemonic|tip/i.test(calloutText)) {
        blocks.push({ kind: "memory", text: calloutText.replace(/^(remember|memory|mnemonic|tip):?\s*/i, "") });
      } else if (/why|matters/i.test(calloutText)) {
        blocks.push({ kind: "why", text: calloutText });
      } else if (/analogy|picture/i.test(calloutText)) {
        blocks.push({ kind: "analogy", text: calloutText });
      } else {
        blocks.push({ kind: "paragraph", text: calloutText });
      }
      continue;
    }

    // Bullet or Numbered Lists (- Item, * Item, 1. Item)
    const listMatch = line.match(/^(?:[-*•]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const itemText = listMatch[1].replace(/\*\*/g, "").trim();
      currentList.push(itemText);
      continue;
    }

    // Key-Value Definitions: **Term**: Description  or  Term: Description
    const defMatch = line.match(/^(?:\*\*)?([A-Za-z0-9\s_-]{2,35})(?:\*\*)?:\s+(.+)$/);
    if (defMatch && !line.startsWith("http") && !line.startsWith("https")) {
      flushList();
      const term = defMatch[1].trim();
      const defText = defMatch[2].replace(/\*\*/g, "").trim();
      if (/why it matters/i.test(term)) {
        blocks.push({ kind: "why", text: defText });
      } else if (/analogy/i.test(term)) {
        blocks.push({ kind: "analogy", text: defText });
      } else if (/example|instance/i.test(term)) {
        blocks.push({ kind: "example", text: defText });
      } else if (/summary/i.test(term)) {
        blocks.push({ kind: "summary", text: defText });
      } else if (/memory|mnemonic/i.test(term)) {
        blocks.push({ kind: "memory", text: defText });
      } else {
        blocks.push({ kind: "definition", term, text: defText });
      }
      continue;
    }

    // Plain text paragraph
    flushList();
    const cleanParagraph = line.replace(/\*\*/g, "").replace(/`/g, "").trim();
    if (cleanParagraph) {
      blocks.push({ kind: "paragraph", text: cleanParagraph });
    }
  }

  flushList();
  flushCode();

  // If no section heading was created, insert a default heading
  if (!blocks.some((b) => b.kind === "section")) {
    blocks.unshift({ kind: "section", text: "Overview" });
  }

  return {
    title: cleanTopic.slice(0, 80),
    subtitle: null,
    blocks,
  };
}
