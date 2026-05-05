import AppShell from "@/components/shared/AppShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — REX",
  description: "Choose a credit pack and start generating AI images on REX.",
};

export default function BuyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
