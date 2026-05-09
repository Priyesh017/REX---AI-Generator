// app/explore/page.tsx
import ExploreFeedPage from "@/components/explore/ExploreFeedPage";

export const metadata = {
  title: "Explore - REX",
  description: "Discover the latest and greatest AI creations from the REX community.",
};

export default function ExploreRoute() {
  return <ExploreFeedPage />;
}
