"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const stepsData = [
  {
    title: "Describe Your Vision",
    description:
      "Type a phrase, sentence, or paragraph that describes the image you want to create.",
    icon: "/step_icon_1.svg",
  },
  {
    title: "Watch the Magic",
    description:
      "Our AI-powered engine will transform your text into a high-quality, unique image in seconds.",
    icon: "/step_icon_2.svg",
  },
  {
    title: "Download & Share",
    description:
      "Instantly download your creation or share it with the world directly from our platform.",
    icon: "/step_icon_3.svg",
  },
];

const Guide = () => {
  return (
    <div className="relative z-10 max-h-screen flex flex-col justify-center items-center mx-auto p-4 md:px-6 md:py-32 text-muted text-center">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2">How it works</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Transform Words Into Stunning Images
      </p>
      <div className="space-y-4 w-full max-w-3xl text-sm text-left">
        {stepsData.map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{
              scale: 1.03,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center gap-4 p-5 bg-black/20 backdrop-blur-lg shadow-lg border border-neutral-800 rounded-lg cursor-pointer"
          >
            <Image src={item.icon} alt={item.title} width={40} height={40} />
            <div>
              <h2 className="text-xl font-medium">{item.title}</h2>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
export default Guide;
