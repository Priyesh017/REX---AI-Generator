"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImage = void 0;
const supabase_1 = require("../config/supabase");
const huggingface_1 = require("../config/huggingface");
const upload_1 = require("../lib/upload");
const titleGenerator_1 = require("../lib/titleGenerator");
const generateImage = async (req, res) => {
    const { prompt } = req.body;
    const user_id = req.user?.id || req.userId;
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }
    console.log("👤 user_id in controller:", user_id);
    if (!user_id) {
        console.warn("⚠️ Missing user_id in controller");
        return res.status(401).json({ error: "Unauthorized: User ID missing" });
    }
    try {
        // Step 1: Generate image
        const imageBuffer = await (0, huggingface_1.generateImageFromPrompt)(prompt);
        // Step 2: Upload to Supabase Storage
        const imageUrl = await (0, upload_1.uploadImageToBucket)(imageBuffer);
        // Step 3: Generate title
        const title = await (0, titleGenerator_1.generateTitleFromPrompt)(prompt);
        // Step 4: Insert metadata into database
        const { data: image, error } = await supabase_1.supabase
            .from("images")
            .insert([{ title, prompt, user_id, image_url: imageUrl }])
            .select()
            .single();
        if (error) {
            console.error("❌ Supabase DB error:", error);
            return res.status(500).json({ error: "Database insert failed" });
        }
        return res.status(201).json({ image });
    }
    catch (err) {
        console.error("❌ Image generation failed:", err.message || err);
        return res.status(500).json({ error: "Image generation failed" });
    }
};
exports.generateImage = generateImage;
