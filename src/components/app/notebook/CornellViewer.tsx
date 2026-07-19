import { useMemo, useState } from "react";
import type { NotebookDoc, NotebookBlock } from "@/lib/study-notes.schema";
import { BlockRenderer } from "./blocks";
import { BookOpen, Key, FileText, CheckCircle2, Bookmark } from "lucide-react";

export function CornellViewer({ doc }: { doc: NotebookDoc }) {
  const [activeTab, setActiveTab] = useState<"all" | "cues" | "notes">("all");

  // Extract cues, main notes, and summaries cleanly
  const { cues, notes, summaryItems } = useMemo(() => {
    const cuesList: string[] = [];
    const mainNotes: NotebookBlock[] = [];
    const summaries: string[] = [];

    for (const b of doc.blocks) {
      if (!b) continue;
      if (b.kind === "section") {
        if (b.text) cuesList.push(b.text);
        mainNotes.push(b);
      } else if (b.kind === "definition") {
        if (b.term) cuesList.push(`Def: ${b.term}`);
        mainNotes.push(b);
      } else if (b.kind === "formula") {
        if (b.label) cuesList.push(`Eq: ${b.label}`);
        mainNotes.push(b);
      } else if (b.kind === "summary") {
        if (b.text) summaries.push(b.text);
      } else if (b.kind === "revision" || b.kind === "checklist") {
        if (b.items?.length) cuesList.push(...b.items.slice(0, 2));
        mainNotes.push(b);
      } else {
        mainNotes.push(b);
      }
    }

    return { cues: cuesList, notes: mainNotes, summaryItems: summaries };
  }, [doc]);

  return (
    <div className="w-full max-h-[78vh] overflow-y-auto no-scrollbar rounded-2xl border-2 border-slate-800 bg-[#FFFDF9] p-4 sm:p-6 shadow-2xl text-slate-800 flex flex-col justify-between">
      {/* Header Bar */}
      <div className="shrink-0 border-b-2 border-slate-800 pb-3 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <Bookmark className="h-4 w-4 text-purple-700 shrink-0" />
            <span>Subject:</span>
            <span className="text-slate-900 font-extrabold truncate max-w-[200px] sm:max-w-none">
              {doc.title}
            </span>
          </div>
          <div className="hidden sm:block text-purple-800 font-black tracking-widest bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">
            CORNELL NOTES
          </div>
          <div>
            Date: <span className="text-slate-900">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Mobile Filter Tabs */}
        <div className="mt-3 flex sm:hidden items-center gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            All Notes
          </button>
          <button
            onClick={() => setActiveTab("cues")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === "cues"
                ? "bg-purple-700 text-white"
                : "bg-purple-100 text-purple-800"
            }`}
          >
            Keywords ({cues.length})
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === "notes"
                ? "bg-indigo-700 text-white"
                : "bg-indigo-100 text-indigo-800"
            }`}
          >
            Notes ({notes.length})
          </button>
        </div>
      </div>

      {/* Main Cornell Split Body */}
      <div className="grow grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 min-h-[380px] pb-6 border-b-2 border-slate-800">
        {/* Left Column: Cues & Keywords */}
        <div
          className={`${
            activeTab === "notes" ? "hidden md:block" : "block"
          } space-y-3 bg-purple-50/50 p-4 rounded-xl border border-purple-200/70 max-h-[500px] overflow-y-auto no-scrollbar`}
        >
          <div className="text-xs font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5 border-b border-purple-200 pb-2">
            <Key className="h-3.5 w-3.5 text-purple-700" /> Cues & Keywords
          </div>
          <ul className="space-y-2 text-xs font-medium">
            {cues.map((cue, idx) => (
              <li
                key={idx}
                className="rounded-lg bg-white p-2.5 border border-purple-200/80 shadow-2xs font-bold text-purple-950 leading-snug break-words flex items-start gap-2"
              >
                <span className="text-purple-600 font-extrabold text-sm leading-none">•</span>
                <span>{cue}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Main Notes */}
        <div
          className={`${
            activeTab === "cues" ? "hidden md:block" : "block"
          } space-y-6 pt-2 md:pl-2 overflow-y-auto no-scrollbar max-h-[500px]`}
        >
          <div className="text-xs font-black uppercase text-slate-700 tracking-wider border-b border-slate-300 pb-2 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-700" /> Main Notes & Explanations
          </div>
          <div className="space-y-6">
            {notes.map((b, i) => (
              <div key={i} className="relative pt-1">
                <BlockRenderer block={b} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Summary Box */}
      <div className="shrink-0 pt-4 mt-2">
        <div className="text-xs font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1.5 mb-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Summary & Key Takeaways
        </div>
        <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50/70 p-4 text-xs sm:text-sm font-medium text-emerald-950 leading-relaxed shadow-2xs break-words">
          {summaryItems.length > 0 ? (
            summaryItems.map((s, i) => (
              <p key={i} className="mb-1.5 last:mb-0">
                • {s}
              </p>
            ))
          ) : (
            <p>
              {doc.title}: Key definitions, core concepts, and formulas summarized for quick revision.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
