"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Guide from "./landingpage/guide";
import HeroContent from "./landingpage/hero-content";
import Description from "./landingpage/description";
import GenerateBtn from "./landingpage/generate-btn";
import ImagePromptSection from "./landingpage/image-prompt";

// interface Section {
//   id: number;
//   color: string;
//   content: React.ReactNode;
// }

const sections = [
  {
    id: 1,
    color: "bg-indigo-600",
    content: <HeroContent />,
  },
  {
    id: 2,
    color: "bg-purple-600",
    content: <Guide />,
  },
  {
    id: 3,
    color: "bg-rose-600",
    content: <Description />,
  },
  {
    id: 4,
    color: "bg-cyan-600",
    content: <ImagePromptSection />,
  },
  {
    id: 5,
    color: "bg-amber-600",
    content: <GenerateBtn />,
  },
];

export default function ScrollStack() {
  const [scrollIndex, setScrollIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) return;

      setIsScrolling(true);

      if (e.deltaY > 0 && scrollIndex < sections.length - 1) {
        setScrollIndex((prev) => prev + 1);
      } else if (e.deltaY < 0 && scrollIndex > 0) {
        setScrollIndex((prev) => prev - 1);
      }

      setTimeout(() => {
        setIsScrolling(false);
      }, 800);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [scrollIndex, isScrolling]);

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {sections.map(({ id, content }, i) => (
        <motion.div
          key={id}
          className="absolute top-0 left-0 w-full h-screen px-4 flex items-center justify-center"
          initial={{ y: "100%", opacity: 0 }}
          animate={{
            y: scrollIndex === i ? "0%" : scrollIndex > i ? "-100%" : "100%",
            opacity: scrollIndex === i ? 1 : 0,
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            zIndex: scrollIndex === i ? 50 : -50,
            pointerEvents: scrollIndex === i ? "auto" : "none",
          }}
        >
          {content}
        </motion.div>
      ))}
    </div>
  );
}
