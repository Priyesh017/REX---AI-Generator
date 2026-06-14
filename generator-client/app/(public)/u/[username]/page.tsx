import { Metadata } from "next";
import AppShell from "@/components/shared/AppShell";
import PublicProfilePage from "@/components/profile/PublicProfilePage";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} — REX`,
    description: `View ${username}'s AI-generated art and collections on REX.`,
    openGraph: {
      title: `@${username} on REX`,
      description: `Explore AI-generated artwork by @${username}`,
    },
  };
}

export default async function UserProfileRoute({ params }: Props) {
  const { username } = await params;
  return (
    <AppShell>
      <PublicProfilePage username={username} />
    </AppShell>
  );
}
