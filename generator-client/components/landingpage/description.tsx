"use client";

import Image from "next/image";
import React from "react";

const Description = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen mt-16 mx-auto px-4 md:px-6 py-24 md:py-32 text-muted">
      <h1 className="text-3xl sm:text-4xl font-semibold mb-2">
        Creat AI Images
      </h1>
      <p className="text-muted-foreground mb-8">
        Turn your imagination into visuals
      </p>
      <div className="flex flex-col md:flex-row items-center gap-5 md:gap-14">
        <Image
          src="/sample_img_1.png"
          alt=""
          width={1200}
          height={1200}
          className="w-80 xl:w-96 rounded-lg"
        />
        <div className="text-muted-foreground max-w-lg">
          <h2 className="text-3xl font-medium mb-4 text-muted">
            Introducing the AI-Powered Generator
          </h2>
          <p className="mb-2 text-justify">
            Easily bring your ideas to life with our free AI generator. Whether
            you need stunning visuals or unique imagery, our tool transforms
            your thoughts into eye-catching visuals with just one click. Imagine
            it, describe it, and watch it come to life instantly.
          </p>
          <p>
            Simple type in a text prompt, and our cutting-edge AI will generate
            high-quality visuals in sceonds. From Product visuals to character
            designs and portraits, even concepts that don&apos;t yet exist can
            be visualized effortlessly. Powered by advance AI technoology, the
            creative possibilities are limitless!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Description;
