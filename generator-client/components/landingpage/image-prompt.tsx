// components/ImagePromptSection.tsx
import { ImagePromptCard } from "../ui/image-prompt-card";

const prompts = [
  {
    imageUrl: "/woman-red-jacket.png",
    prompt:
      "Super Realism, Woman in a red jacket, snowy, in the style of hyper-realistic portraiture, caninecore, mountainous vistas, timeless beauty, palewave, iconic, distinctive noses --ar 72:101 --stylize 750 --v 6",
  },
  {
    imageUrl: "/man-sweater.png",
    prompt:
      "Super Realism, Headshot of handsome young man, wearing dark gray sweater with buttons and big shawl collar, brown hair and short beard, serious look on his face, black background, soft studio lighting, portrait photography --ar 85:128 --v 6.0 --style rawHeadshot of handsome young man, wearing dark gray sweater with buttons and big shawl collar, brown hair and short beard, serious look on his face, black background, soft studio lighting, portrait photography --ar 85:128 --v 6.0 --style rawHeadshot of handsome young man, wearing dark gray sweater with buttons and big shawl collar, brown hair and short beard, serious look on his face, black background, soft studio lighting, portrait photography --ar 85:128 --v 6.0 --style raw",
  },
  {
    imageUrl: "/woman-sony.png",
    prompt:
      "Super Realism, High-resolution photograph, woman, UHD, photorealistic, shot on a Sony A7III --chaos 20 --ar 1:2 --style raw --stylize 250",
  },
];

export default function ImagePromptSection() {
  return (
    <div className="relative z-10 w-full h-screen flex flex-col justify-center items-center px-4 md:px-6 py-24 md:py-32 text-muted">
      <h2 className="text-3xl sm:text-4xl font-bold mt-20 mb-2 text-center">
        Generated Prompts Gallery
      </h2>
      <p className="text-lg text-muted-foreground mb-8">
        Showcase of AI-Generated Images and Their Prompts
      </p>
      <div className="flex flex-wrap gap-6 justify-center">
        {prompts.map((item, index) => (
          <ImagePromptCard
            key={index}
            imageUrl={item.imageUrl}
            prompt={item.prompt}
          />
        ))}
      </div>
    </div>
  );
}
