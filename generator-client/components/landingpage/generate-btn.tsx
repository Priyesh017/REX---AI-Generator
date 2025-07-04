"use client";

import React from "react";
import BreathingNeonButton from "../ui/generate-button";
import Footer from "../footer";

const GenerateBtn = () => {
  return (
    <div className="relative z-10 max-h-screen">
      <div className="text-center h-[80vh] md:h-[92vh] md:py-32">
        <h1 className="text-2xl md:text-3xl lg:text-4xl mt-4 font-semibold text-muted py-16">
          See the magic. Try Now
        </h1>
        <BreathingNeonButton />
      </div>
      <Footer />
    </div>
  );
};

export default GenerateBtn;
