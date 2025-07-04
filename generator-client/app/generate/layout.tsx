import React from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import HeroBackground from "@/components/ui/geometric-bg";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <main className="min-h-screen">
        <div className="fixed inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none z-10" />
        <Navbar />
        <HeroBackground />
        {children}
        <div className="w-full mx-auto px-4">
          <Footer />
        </div>
      </main>
    </div>
  );
}
