import type { Metadata } from "next";
import AppShell from "@/components/shared/AppShell";
import StudioPageClient from "@/components/studio/StudioPage";

export const metadata: Metadata = {
  title: "Generate - REX",
  description: "Generate AI images from prompts and save them to your REX studio.",
};

export default function GeneratePage() {
  return (
    <AppShell>
      <StudioPageClient />
    </AppShell>
  );
}
