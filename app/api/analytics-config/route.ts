import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function valid(value: string | undefined, pattern: RegExp) {
  const normalized = value?.trim();
  return normalized && pattern.test(normalized) ? normalized : null;
}

function validUrl(value: string | undefined, hosts: string[]) {
  try {
    const url = new URL(value || "");
    return url.protocol === "https:" && hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export async function GET() {
  return NextResponse.json(
    {
      gtmId: valid(process.env.NEXT_PUBLIC_GTM_ID, /^GTM-[A-Z0-9]+$/i),
      metaPixelId: valid(process.env.NEXT_PUBLIC_META_PIXEL_ID, /^\d+$/),
      ga4Id: valid(process.env.NEXT_PUBLIC_GA4_ID, /^G-[A-Z0-9]+$/i),
      utmifyPixelId: valid(process.env.NEXT_PUBLIC_UTMIFY_PIXEL_ID, /^[a-f0-9]+$/i),
      youtubeVideoUrl: validUrl(process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_URL, ["youtube.com", "youtu.be"]),
      hotmartCheckoutUrl: validUrl(process.env.NEXT_PUBLIC_HOTMART_CHECKOUT_URL, ["hotmart.com"]),
      debug: process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
