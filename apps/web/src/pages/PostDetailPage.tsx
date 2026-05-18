import { useParams } from 'react-router';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center font-mono text-mono text-tm">
      // post.detail [{id}] coming soon · M8
    </div>
  );
}
