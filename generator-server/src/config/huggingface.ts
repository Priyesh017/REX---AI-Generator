import { HfInference } from "@huggingface/inference";
import { env } from "./env";
import { logger } from "../utils/logger";

const hf = new HfInference(env.huggingfaceToken);

export const generateImageFromPrompt = async (
  prompt: string
): Promise<Buffer> => {
  try {
    logger.info(`🖼️ Generating image for prompt: "${prompt}"`);

    const result = await hf.textToImage({
      model: env.huggingfaceModel,
      inputs: prompt,
      parameters: {
        negative_prompt: "low quality, blurry, extra limbs, watermark, text",
      },
      //@ts-ignore - Some versions of the HF SDK support this to handle cold models
      options: {
        wait_for_model: true,
      }
    });

    // Use duck-typing instead of instanceof
    if (!result || typeof (result as any).arrayBuffer !== "function") {
      throw new Error("Unexpected response from Hugging Face API");
    }

    const arrayBuffer = await (result as unknown as Response).arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    logger.error("❌ Failed to generate image:", error?.message || error);
    throw new Error("Image generation failed. Please try again later.");
  }
};
