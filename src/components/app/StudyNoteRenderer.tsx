import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseMarkdownToNotebookDoc } from "@/lib/study-notes.parser";
import {
  NotebookViewer,
  NotebookViewerSkeleton,
} from "./notebook/NotebookViewer";
import type { StudyStyleT, NotebookDoc } from "@/lib/study-notes.schema";

export function StudyNoteRenderer({
  messageId,
  threadId,
  userQuestion,
  assistantMarkdown,
  style,
}: {
  messageId: string;
  threadId: string | null;
  userQuestion: string;
  assistantMarkdown: string;
  style: StudyStyleT;
  pageNumber?: number;
}) {
  const [cachedDoc, setCachedDoc] = useState<NotebookDoc | null>(null);
  const [loadingCache, setLoadingCache] = useState(true);
  const enabled = !!messageId && !!assistantMarkdown.trim();

  // Instant local parser for immediate, 100% reliable rendering
  const parsedDoc = useMemo(() => {
    return parseMarkdownToNotebookDoc(userQuestion, assistantMarkdown);
  }, [userQuestion, assistantMarkdown]);

  // Check cache or save parsed doc to Supabase
  useEffect(() => {
    if (!enabled) return;
    async function loadAndSave() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoadingCache(false);
          return;
        }

        const { data } = await supabase
          .from("study_notes")
          .select("*")
          .eq("user_id", user.id)
          .eq("message_id", messageId)
          .maybeSingle();

        if (data?.structured) {
          setCachedDoc(data.structured as unknown as NotebookDoc);
        } else if (parsedDoc.blocks.length > 0) {
          // Persist the parsed doc to DB so it is cached for future visits
          await supabase.from("study_notes").upsert(
            {
              user_id: user.id,
              thread_id: threadId,
              message_id: messageId,
              topic: parsedDoc.title,
              style: style || "ruled",
              structured: parsedDoc as never,
              markdown: assistantMarkdown,
            } as never,
            { onConflict: "user_id,message_id" },
          );
        }
      } catch (e) {
        console.warn("[Study Notes] Cache sync error:", e);
      } finally {
        setLoadingCache(false);
      }
    }
    loadAndSave();
  }, [messageId, threadId, userQuestion, assistantMarkdown, style, enabled, parsedDoc]);

  const docToRender = cachedDoc || parsedDoc;

  if (loadingCache) return <NotebookViewerSkeleton />;

  return <NotebookViewer doc={docToRender} style={style} />;
}
