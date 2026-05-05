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
  return (
    <AppShell>
      <PostDetailPage postId={id} />
    </AppShell>
  );
}
