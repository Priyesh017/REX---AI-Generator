"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageGenerator from "@/components/pages/image-generator";
import PromptHistory from "@/components/pages/prompt-history";
import { useAuth } from "@clerk/nextjs";
import { motion, Variants } from "framer-motion";

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: 0.5 + i * 0.2,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
};

const Generate = () => {
  const { isSignedIn } = useAuth();

  return (
    <motion.div
      custom={5}
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      className="relative z-10 min-h-screen flex flex-col gap-6 justify-center items-center mx-auto px-4 md:px-6 py-24 md:py-32 text-muted"
    >
      <Tabs defaultValue="generator" className="w-full">
        {isSignedIn && (
          <TabsList className="mx-auto">
            <TabsTrigger value="generator">Image Generator</TabsTrigger>
            <TabsTrigger value="history">Prompt History</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="generator">
          <ImageGenerator />
        </TabsContent>
        {isSignedIn && (
          <TabsContent value="history">
            <PromptHistory />
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
};

export default Generate;
