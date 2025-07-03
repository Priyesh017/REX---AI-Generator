// utils/imageCache.ts
import Cookies from "js-cookie";

const COOKIE_KEY = "latest_image_url";

export const saveImageUrlToCookie = (url: string) => {
  Cookies.set(COOKIE_KEY, url, { expires: 1 }); // expires in 1 day
};

export const getImageUrlFromCookie = (): string | undefined => {
  return Cookies.get(COOKIE_KEY);
};

export const clearImageUrlCookie = () => {
  Cookies.remove(COOKIE_KEY);
};
