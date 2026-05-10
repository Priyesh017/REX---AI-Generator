// app/explore/page.tsx
import ExploreFeedPage from "@/components/explore/ExploreFeedPage";

export const metadata = {
  title: "Explore - REX",
  description: "Discover the latest and greatest AI creations from the REX community.",
};

export default async function ExploreRoute() {
  // Server-side fetch for faster perceived load and SEO
  let initialPosts = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/public?limit=48`, {
      // Use revalidate or no-store depending on how fresh the feed needs to be
      next: { revalidate: 60 } 
    });
    if (res.ok) {
      const json = await res.json();
      initialPosts = json.data?.posts || [];
    }
  } catch (err) {
    console.error("Failed to fetch initial explore feed:", err);
  }

  return <ExploreFeedPage initialPosts={initialPosts} />;
}
