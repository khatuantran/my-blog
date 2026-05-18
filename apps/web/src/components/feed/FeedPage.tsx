import { useState } from 'react';
import type { Mood } from '@/lib/mood-config';
import { FilterBar } from './FilterBar';
import { PostList } from './PostList';

export function FeedPage() {
  const [mood, setMood] = useState<Mood | null>(null);
  const [total, setTotal] = useState<number | undefined>(undefined);

  return (
    <div className="mx-auto max-w-[820px] px-6 py-4">
      <FilterBar activeMood={mood} total={total} onMoodFilter={setMood} />
      <PostList mood={mood} onTotal={setTotal} />
    </div>
  );
}
