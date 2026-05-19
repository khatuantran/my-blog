import { useState } from 'react';
import type { Mood } from '@/lib/mood-config';
import { FilterBar, type PostSort } from './FilterBar';
import { PostList } from './PostList';

export function FeedPage() {
  const [mood, setMood] = useState<Mood | null>(null);
  const [sort, setSort] = useState<PostSort>('latest');
  const [total, setTotal] = useState<number | undefined>(undefined);

  return (
    <div className="mx-auto max-w-[820px] px-6 py-4">
      <FilterBar
        activeMood={mood}
        total={total}
        sort={sort}
        onMoodFilter={setMood}
        onSortChange={setSort}
      />
      <PostList mood={mood} sort={sort} onTotal={setTotal} />
    </div>
  );
}
