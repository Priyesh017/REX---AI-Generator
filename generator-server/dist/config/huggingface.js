"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImageFromPrompt = void 0;
const inference_1 = require("@huggingface/inference");
const env_1 = require("./env");
const hf = new inference_1.HfInference(env_1.env.huggingfaceToken);
const generateImageFromPrompt = async (prompt) => {
    try {
        console.log(`🖼️ Generating image for prompt: "${prompt}"`);
        const result = await hf.textToImage({
            model: env_1.env.huggingfaceModel,
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
        if (!result || typeof result.arrayBuffer !== "function") {
            throw new Error("Unexpected response from Hugging Face API");
        }
        const arrayBuffer = await result.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
    catch (error) {
        console.error("❌ Failed to generate image:", error?.message || error);
        throw new Error("Image generation failed. Please try again later.");
    }
};
exports.generateImageFromPrompt = generateImageFromPrompt;
