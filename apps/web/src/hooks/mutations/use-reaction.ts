import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { removeReaction, upsertReaction } from '@/services/api/reactions';
import { ApiError } from '@/services/api/client';
import { qk } from '@/lib/query-keys';
import type {
  PaginatedPosts,
  Post,
  ReactionCountsResponse,
  ReactionType,
  UpsertReactionResponse,
} from '@/types/api';

type ListSnapshot = [readonly unknown[], InfiniteData<PaginatedPosts> | undefined][];

interface MutationCtx {
  prevDetail?: Post;
  prevCounts?: ReactionCountsResponse;
  prevLists: ListSnapshot;
}

function recomputeTopThree(
  post: Post,
  oldType: ReactionType | null,
  newType: ReactionType | null,
): {
  topReactions: ReactionType[];
  reactionsTotal: number;
} {
  const counts: Partial<Record<ReactionType, number>> = {};
  for (const t of post.topReactions) counts[t] = counts[t] ?? 1;
  // We don't have full per-type counts on Post (only topReactions[3]); approximate by
  // bumping the new type and decrementing the old. Server settle will reconcile.
  if (oldType) counts[oldType] = Math.max(0, (counts[oldType] ?? 1) - 1);
  if (newType) counts[newType] = (counts[newType] ?? 0) + 1;

  const sorted = (Object.entries(counts) as [ReactionType, number][])
    .filter(([, n]) => n > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([t]) => t)
    .slice(0, 3);

  const delta = (newType ? 1 : 0) - (oldType ? 1 : 0);
  return {
    topReactions: sorted.length > 0 ? sorted : post.topReactions,
    reactionsTotal: Math.max(0, post.counts.reactions + delta),
  };
}

function patchPost(post: Post, oldType: ReactionType | null, newType: ReactionType | null): Post {
  const { topReactions, reactionsTotal } = recomputeTopThree(post, oldType, newType);
  return {
    ...post,
    myReaction: newType,
    topReactions,
    counts: { ...post.counts, reactions: reactionsTotal },
  };
}

function snapshotAndPatchLists(
  qc: ReturnType<typeof useQueryClient>,
  postId: string,
  mutator: (p: Post) => Post,
): ListSnapshot {
  const entries = qc.getQueriesData<InfiniteData<PaginatedPosts>>({ queryKey: ['posts', 'list'] });
  const snapshot: ListSnapshot = [];
  for (const [key, data] of entries) {
    snapshot.push([key, data]);
    if (!data) continue;
    qc.setQueryData<InfiniteData<PaginatedPosts>>(key, {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((p) => (p.id === postId ? mutator(p) : p)),
      })),
    });
  }
  return snapshot;
}

export function useUpsertReaction() {
  const qc = useQueryClient();
  return useMutation<
    UpsertReactionResponse,
    Error,
    { postId: string; type: ReactionType; currentType: ReactionType | null },
    MutationCtx
  >({
    mutationFn: ({ postId, type }) => upsertReaction(postId, type),
    onMutate: async ({ postId, type, currentType }) => {
      await qc.cancelQueries({ queryKey: qk.posts.all });
      const prevLists = snapshotAndPatchLists(qc, postId, (p) => patchPost(p, currentType, type));
      const prevDetail = qc.getQueryData<Post>(qk.posts.detail(postId));
      if (prevDetail) {
        qc.setQueryData<Post>(qk.posts.detail(postId), patchPost(prevDetail, currentType, type));
      }
      const prevCounts = qc.getQueryData<ReactionCountsResponse>(qk.posts.reactionCounts(postId));
      return { prevDetail, prevCounts, prevLists };
    },
    onError: (err, { postId }, ctx) => {
      if (!ctx) return;
      for (const [key, data] of ctx.prevLists) qc.setQueryData(key, data);
      if (ctx.prevDetail) qc.setQueryData(qk.posts.detail(postId), ctx.prevDetail);
      // 410 Gone — legacy endpoint accidentally hit. Surface to caller via mutation.error;
      // caller renders inline error. Cache already rolled back.
      if (err instanceof ApiError && err.status === 410) {
        // No-op beyond rollback; caller checks mutation.error.
      }
    },
    onSettled: (_data, _err, { postId }) => {
      qc.invalidateQueries({ queryKey: qk.posts.detail(postId) });
      qc.invalidateQueries({ queryKey: ['posts', 'list'] });
      qc.invalidateQueries({ queryKey: qk.posts.reactionCounts(postId) });
      qc.invalidateQueries({ queryKey: qk.posts.reactionList(postId) });
    },
  });
}

export function useRemoveReaction() {
  const qc = useQueryClient();
  return useMutation<void, Error, { postId: string; currentType: ReactionType }, MutationCtx>({
    mutationFn: ({ postId }) => removeReaction(postId),
    onMutate: async ({ postId, currentType }) => {
      await qc.cancelQueries({ queryKey: qk.posts.all });
      const prevLists = snapshotAndPatchLists(qc, postId, (p) => patchPost(p, currentType, null));
      const prevDetail = qc.getQueryData<Post>(qk.posts.detail(postId));
      if (prevDetail) {
        qc.setQueryData<Post>(qk.posts.detail(postId), patchPost(prevDetail, currentType, null));
      }
      const prevCounts = qc.getQueryData<ReactionCountsResponse>(qk.posts.reactionCounts(postId));
      return { prevDetail, prevCounts, prevLists };
    },
    onError: (_err, { postId }, ctx) => {
      if (!ctx) return;
      for (const [key, data] of ctx.prevLists) qc.setQueryData(key, data);
      if (ctx.prevDetail) qc.setQueryData(qk.posts.detail(postId), ctx.prevDetail);
    },
    onSettled: (_data, _err, { postId }) => {
      qc.invalidateQueries({ queryKey: qk.posts.detail(postId) });
      qc.invalidateQueries({ queryKey: ['posts', 'list'] });
      qc.invalidateQueries({ queryKey: qk.posts.reactionCounts(postId) });
      qc.invalidateQueries({ queryKey: qk.posts.reactionList(postId) });
    },
  });
}
