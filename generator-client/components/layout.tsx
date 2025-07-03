import HeroBackground from "./ui/geometric-bg";
import Navbar from "./navbar";
import ScrollStack from "./scroll-stack";

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#030303]">
      <div className="fixed inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none z-10" />
      <Navbar />
      <HeroBackground />
      <ScrollStack />
    </div>
  );
}
