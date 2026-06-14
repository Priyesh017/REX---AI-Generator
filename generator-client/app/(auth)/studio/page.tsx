import { Metadata } from "next";
import AppShell from "@/components/shared/AppShell";
import StudioPageClient from "@/components/studio/StudioPage";

export const metadata: Metadata = {
  title: "Studio — REX",
  description:
    "Generate AI images from your prompts and manage your private draft collection.",
};

export default function StudioPage() {
  return (
    <AppShell>
      <StudioPageClient />
    </AppShell>
  );
}
