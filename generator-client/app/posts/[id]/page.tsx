// app/posts/[id]/page.tsx
// Post detail page — the canonical URL for a published social post.
// SSR with OG meta for SEO and social sharing.
// Phase 2: Will fetch real post data from /api/posts/:id.

import { Metadata } from "next";
import PostDetailPage from "@/components/post/PostDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  // await params; // Phase 2: id will be needed here to fetch real post data for dynamic OG tags
  return {
    title: "Post — REX",
    description: "View this AI-generated image on REX.",
    openGraph: {
      title: "AI Generated Image on REX",
      description: "Explore AI artwork on REX, the social platform for AI-generated art.",
    },
  };
}

export default async function PostRoute({ params }: Props) {
  const { id } = await params;
  return <PostDetailPage postId={id} />;
}
