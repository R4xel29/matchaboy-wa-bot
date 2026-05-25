export function parseUserAgent(uaString: string) {
  const ua = uaString.toLowerCase();
  
  // 1. Device Type
  let deviceType = "Desktop";
  if (/mobi|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) {
      deviceType = "Tablet";
    } else {
      deviceType = "Mobile";
    }
  }

  // 2. Operating System
  let os = "Unknown OS";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("macintosh") || ua.includes("mac os x")) {
    if (ua.includes("ipad") || ua.includes("iphone")) os = "iOS";
    else os = "macOS";
  }
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) os = "iOS";
  else if (ua.includes("linux")) os = "Linux";

  // 3. Browser
  let browser = "Unknown Browser";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome") || ua.includes("crios")) {
    if (ua.includes("opr/")) browser = "Opera";
    else browser = "Chrome";
  }
  else if (ua.includes("safari")) {
    if (ua.includes("chrome") || ua.includes("crios")) browser = "Chrome";
    else browser = "Safari";
  }
  else if (ua.includes("firefox") || ua.includes("fxios")) browser = "Firefox";
  else if (ua.includes("opr/")) browser = "Opera";
  else if (ua.includes("trident/")) browser = "Internet Explorer";

  return { deviceType, os, browser };
}
