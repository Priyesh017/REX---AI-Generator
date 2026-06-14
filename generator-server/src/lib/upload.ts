import { supabase } from "../config/supabase";
import { randomUUID } from "crypto";

export const uploadImageToBucket = async (
  imageBuffer: Buffer,
  contentType = "image/webp"
): Promise<string> => {
  const ext = contentType.split("/")[1] || "webp";
  const fileName = `${randomUUID()}.${ext}`;

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
