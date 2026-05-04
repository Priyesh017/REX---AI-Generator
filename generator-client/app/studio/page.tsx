// app/studio/page.tsx
// Studio page — generate images and manage draft assets.
// This is the evolution of /generate with the history tab.
// Separate from /generate which remains as a redirect alias.

import { Metadata } from "next";
import StudioPageClient from "@/components/studio/StudioPage";

export const metadata: Metadata = {
  title: "Studio — REX",
  description:
    "Generate AI images from your prompts and manage your draft collection in the REX studio.",
};

export default function StudioPage() {
  return <StudioPageClient />;
}
