import { useMemo, useState, useRef, useEffect } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, BookOpen } from "lucide-react";
import type { NotebookDoc, StudyStyleT } from "@/lib/study-notes.schema";
import { paginateNotebook, extractSections } from "./paginate";
import { BlockRenderer } from "./blocks";
import { CornellViewer } from "./CornellViewer";
import { MindMapViewer } from "./MindMapViewer";

export function NotebookViewerSkeleton() {
  return (
    <div className="notebook-page notebook-ruled min-h-[480px]">
      <div className="notebook-holes" aria-hidden />
      <div className="relative flex flex-col items-center justify-center gap-3 py-24 text-[#6d28d9]/80">
        <Loader2 className="h-6 w-6 animate-spin" />
        <div className="font-handwriting text-sm">Sana is preparing your study notes…</div>
      </div>
    </div>
  );
}

export function NotebookViewer({
  doc,
  style = "ruled",
}: {
  doc: NotebookDoc;
  style?: StudyStyleT;
}) {
  // If Cornell or Mindmap visual layouts are selected, delegate to specialized viewers
  if (style === "cornell") {
    return <CornellViewer doc={doc} />;
  }
  if (style === "mindmap") {
    return <MindMapViewer doc={doc} />;
  }

  const pages = useMemo(() => paginateNotebook(doc), [doc]);
  const sections = useMemo(() => extractSections(pages), [pages]);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [tocOpen, setTocOpen] = useState(false);
  const total = pages.length;

  const safeIdx = Math.max(0, Math.min(total - 1, idx));

  const go = (n: number) => {
    const next = Math.max(0, Math.min(total - 1, n));
    if (next === safeIdx) return;
    setDir(next > safeIdx ? 1 : -1);
    setIdx(next);
  };

  const dateStr = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );

  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement && el.contains(document.activeElement)) {
        if (e.key === "ArrowRight") go(safeIdx + 1);
        if (e.key === "ArrowLeft") go(safeIdx - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(safeIdx + 1);
    else if (info.offset.x > 60 || info.velocity.x > 400) go(safeIdx - 1);
  };

  const currentPageBlocks = pages[safeIdx] || [];

  // Style-specific page container CSS styling
  const pageStyleClass = useMemo(() => {
    if (style === "unruled") {
      return "bg-[#FAF8F5] border border-[#e2ddd5] shadow-lg rounded-3xl p-6 sm:p-8 text-slate-800";
    }
    if (style === "book") {
      return "bg-[#FCFCFA] border-2 border-slate-800 shadow-xl rounded-2xl p-6 sm:p-8 font-serif text-slate-900";
    }
    // Default: ruled paper
    return "notebook-page notebook-ruled shadow-card min-h-[520px]";
  }, [style]);

  return (
    <div ref={rootRef} tabIndex={-1} className="relative select-none">
      {/* Title header */}
      <div className="mb-4 px-2 text-center mt-2 flex flex-col items-center">
        {style === "book" ? (
          <div className="mb-2 flex items-center gap-2 border-b-2 border-slate-900 pb-1 text-xs font-black uppercase tracking-widest text-slate-700">
            <BookOpen className="h-3.5 w-3.5 text-slate-900" /> Textbook Study Chapter
          </div>
        ) : null}
        <h1
          className={
            style === "book"
              ? "font-serif text-3xl font-black text-slate-900 tracking-tight"
              : style === "unruled"
                ? "font-sans text-2xl font-black text-slate-900 tracking-tight"
                : "font-handwriting-bold text-[30px] leading-tight text-black underline underline-offset-4 decoration-[2px]"
          }
        >
          {doc.title}
        </h1>
        {doc.subtitle && (
          <div className="text-[14px] font-handwriting text-[#64748b] mt-1">
            {doc.subtitle}
          </div>
        )}
      </div>

      {/* Page stack */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.article
            key={safeIdx}
            custom={dir}
            initial={{ opacity: 0, x: dir * 80, rotateY: dir * -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, x: dir * -80, rotateY: dir * 10, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={onDragEnd}
            className={`${pageStyleClass} min-h-[520px] touch-pan-y relative`}
          >
            {style === "ruled" && <div className="notebook-holes" aria-hidden />}
            <div className="notebook-date font-handwriting text-xs text-slate-500 font-medium">{dateStr}</div>
            
            <div className="notebook-body pt-4">
              {/* Auto-TOC for large notebooks on page 1 */}
              {safeIdx === 0 && total > 4 && sections.length > 1 && (
                <div className="mb-6 rounded-lg border-2 border-dashed border-[#cbd5e1] bg-white/60 p-4">
                  <h3 className="mb-3 font-handwriting-bold text-[18px] text-[#4c1d95]">
                    Table of Contents
                  </h3>
                  <ul className="space-y-2">
                    {sections.map((s) => (
                      <li key={s.index}>
                        <button
                          type="button"
                          onClick={() => go(s.index)}
                          className="flex w-full items-center gap-3 text-left hover:text-[#6d28d9] transition-colors cursor-pointer"
                        >
                          <span className="font-handwriting font-bold text-[#94a3b8]">
                            Pg.{s.index + 1}
                          </span>
                          <span className="text-[14.5px] text-[#334155] border-b border-dotted border-slate-300 flex-1">
                            {s.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {currentPageBlocks.map((b, i) => (
                <BlockRenderer key={i} block={b} />
              ))}
            </div>
            <div className="notebook-page-number font-handwriting font-bold text-[#1e293b] text-[15px] text-right mt-4">
              {safeIdx + 1} / {total}
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="mt-5 flex flex-col items-center gap-3">
        <div className="flex items-center gap-4 bg-card border border-border px-4 py-2 rounded-2xl shadow-sm">
          <button
            type="button"
            onClick={() => go(safeIdx - 1)}
            disabled={safeIdx === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-muted hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-40 disabled:hover:bg-muted disabled:hover:text-muted-foreground cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> Previous Page
          </button>
          
          <span className="text-xs font-bold text-muted-foreground px-2">
            Page {safeIdx + 1} of {total}
          </span>

          <button
            type="button"
            onClick={() => go(safeIdx + 1)}
            disabled={safeIdx >= total - 1}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-40 disabled:hover:bg-primary cursor-pointer shadow-sm"
          >
            Next Page <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Page Thumbnails */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar max-w-full px-2 py-1">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to page ${i + 1}`}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div
                className={`w-12 h-9 rounded border ${
                  i === safeIdx
                    ? "border-[#7C4DFF] ring-2 ring-[#7C4DFF]/30 shadow-sm"
                    : "border-slate-200 opacity-60 group-hover:opacity-100"
                } bg-[#FEFEF6] flex items-center justify-center overflow-hidden transition-all`}
              >
                <div className="w-full h-full relative">
                  <div className="absolute top-0 bottom-0 left-1 w-0.5 bg-red-400/50" />
                  <div className="absolute top-2 left-0 right-0 h-px bg-blue-400/20" />
                  <div className="absolute top-4 left-0 right-0 h-px bg-blue-400/20" />
                  <div className="absolute top-6 left-0 right-0 h-px bg-blue-400/20" />
                </div>
              </div>
              <span
                className={`text-[11px] font-bold ${
                  i === safeIdx ? "text-[#7C4DFF]" : "text-slate-400 group-hover:text-slate-600"
                }`}
              >
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
