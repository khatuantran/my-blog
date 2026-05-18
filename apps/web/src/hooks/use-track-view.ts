import { useEffect, useRef } from 'react';
import { trackPostView } from '@/services/api/posts';

// Track post view 1 lần per mount (BE tự dedup 30min theo userId/anonymousId).
// Silent failure — không block UI nếu network/auth error.
export function useTrackView(postId: string | undefined) {
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!postId || firedRef.current === postId) return;
    firedRef.current = postId;
    void trackPostView(postId).catch(() => {
      // silent
    });
  }, [postId]);
}
