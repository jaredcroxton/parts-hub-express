// Robots file pointing at the catalogue sitemap. API routes and the cart are not for crawlers.
import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://partshubexpress.com").replace(/\/+$/, "");

const SHARE_BOTS = ["facebookexternalhit", "Facebot", "meta-externalagent", "WhatsApp", "Twitterbot", "LinkedInBot", "Slackbot", "Slackbot-LinkExpanding", "TelegramBot", "Discordbot"];

export default function robots(): MetadataRoute.Robots {
  // Until launch (SITE_LIVE=1 on the real domain), search crawlers are kept out: placeholder contacts and unconfirmed content.
  // Link preview crawlers stay allowed so texted and shared links still show the share card (Facebook obeys robots.txt).
  if (process.env.SITE_LIVE !== "1") return { rules: [{ userAgent: SHARE_BOTS, allow: "/" }, { userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/cart"] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
