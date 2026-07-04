import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import fallbackAvatar from "@/assets/sana-avatar.png";

export function useResolvedAvatar(path: string | null) {
  const [url, setUrl] = useState<string>(fallbackAvatar);
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(fallbackAvatar);
      return;
    }
    if (/^https?:\/\//i.test(path)) {
      setUrl(path);
      return;
    }
    (async () => {
      const { data } = await supabase.storage.from("user-uploads").createSignedUrl(path, 60 * 60);
      if (alive && data?.signedUrl) setUrl(data.signedUrl);
    })();
    return () => {
      alive = false;
    };
  }, [path]);
  return url;
}
