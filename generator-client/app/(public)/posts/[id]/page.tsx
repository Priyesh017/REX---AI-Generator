import { Metadata } from "next";
import AppShell from "@/components/shared/AppShell";
import PostDetailPage from "@/components/post/PostDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
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
  
  let initialPost = null;
  let initialSocialStats = null;

  try {
    const [postRes, metaRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${id}`, { next: { revalidate: 60 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/social/posts/${id}/likes`, { next: { revalidate: 60 } })
    ]);

    if (postRes.ok) {
      const json = await postRes.json();
      initialPost = json.data?.post || null;
    }
    if (metaRes.ok) {
      const json = await metaRes.json();
      initialSocialStats = json.data || null;
    }
  } catch (err) {
    console.error("Failed to fetch SSR post data:", err);
  }

  return (
    <AppShell>
      <PostDetailPage 
        postId={id} 
        initialPost={initialPost}
        initialSocialStats={initialSocialStats}
      />
    </AppShell>
  );
}
