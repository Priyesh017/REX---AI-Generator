"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageToBucket = void 0;
const supabase_1 = require("../config/supabase");
const crypto_1 = require("crypto");
const uploadImageToBucket = async (imageBuffer, contentType = "image/png") => {
    const fileName = `${(0, crypto_1.randomUUID)()}.png`;
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase_1.supabase.storage
        .from("generated-images")
        .upload(fileName, imageBuffer, {
        contentType,
        upsert: false,
    });
    if (uploadError) {
        throw new Error("Upload failed: " + uploadError.message);
    }
    // Get the public URL
    const { data } = supabase_1.supabase.storage
        .from("generated-images")
        .getPublicUrl(fileName);
    if (!data?.publicUrl) {
        throw new Error("Failed to get public URL");
    }
    return data.publicUrl;
};
exports.uploadImageToBucket = uploadImageToBucket;
