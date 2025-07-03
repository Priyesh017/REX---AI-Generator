import { supabase } from "../config/supabase";
import { randomUUID } from "crypto";

export const uploadImageToBucket = async (
  imageBuffer: Buffer,
  contentType = "image/png"
): Promise<string> => {
  const fileName = `${randomUUID()}.png`;

  // Debug base64 (optional)
  const base64 = imageBuffer.toString("base64");
  console.log("🧪 Base64 Image Preview:");
  console.log(`data:${contentType};base64,${base64}`);

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("generated-images")
    .upload(fileName, imageBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error("Upload failed: " + uploadError.message);
  }

  // Get the public URL
  const { data } = supabase.storage
    .from("generated-images")
    .getPublicUrl(fileName);

  if (!data?.publicUrl) {
    throw new Error("Failed to get public URL");
  }

  return data.publicUrl;
};
