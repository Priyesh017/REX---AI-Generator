import { Metadata } from "next";
import AppShell from "@/components/shared/AppShell";
import UserProfilePage from "@/components/pages/profile";

export const metadata: Metadata = {
  title: "My Account — REX",
  description: "Manage your REX account, credits, and subscription plan.",
};

export default function ProfileRoute() {
  return (
    <AppShell>
      <UserProfilePage />
    </AppShell>
  );
}
