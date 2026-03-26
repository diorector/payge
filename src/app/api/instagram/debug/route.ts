import { NextRequest, NextResponse } from "next/server";

// GET /api/instagram/debug?username=kimdohyungg
// Returns raw RapidAPI responses for debugging
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username query param required" }, { status: 400 });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RAPIDAPI_KEY not set" }, { status: 500 });
  }

  const host = "instagram-scraper-20251.p.rapidapi.com";
  const headers = {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": host,
  };

  try {
    const [infoRes, postsRes] = await Promise.all([
      fetch(`https://${host}/userinfo/?username_or_id=${encodeURIComponent(username)}`, {
        headers,
        signal: AbortSignal.timeout(15000),
      }),
      fetch(`https://${host}/userposts/?username_or_id=${encodeURIComponent(username)}`, {
        headers,
        signal: AbortSignal.timeout(20000),
      }),
    ]);

    const infoBody = infoRes.ok ? await infoRes.json() : await infoRes.text();
    const postsBody = postsRes.ok ? await postsRes.json() : await postsRes.text();

    // For posts, only return top-level keys and first item summary (to avoid huge response)
    let postsSummary: unknown = postsBody;
    if (postsRes.ok && typeof postsBody === "object" && postsBody !== null) {
      const p = postsBody as Record<string, unknown>;
      const topKeys = Object.keys(p);

      // Find the array of posts wherever it is
      let items: unknown[] = [];
      for (const key of topKeys) {
        if (Array.isArray(p[key])) {
          items = p[key] as unknown[];
          break;
        }
        if (typeof p[key] === "object" && p[key] !== null) {
          const nested = p[key] as Record<string, unknown>;
          for (const nk of Object.keys(nested)) {
            if (Array.isArray(nested[nk])) {
              items = nested[nk] as unknown[];
              break;
            }
          }
          if (items.length > 0) break;
        }
      }

      // Get keys from first item
      const firstItem = items[0] as Record<string, unknown> | undefined;
      postsSummary = {
        topKeys,
        itemCount: items.length,
        firstItemKeys: firstItem ? Object.keys(firstItem) : [],
        firstItemCaptionSample: firstItem?.caption
          ? JSON.stringify(firstItem.caption).slice(0, 300)
          : "no caption field",
        firstItemSample: firstItem
          ? Object.fromEntries(
              Object.entries(firstItem)
                .filter(([, v]) => typeof v !== "object" || v === null)
                .slice(0, 15)
            )
          : null,
      };
    }

    return NextResponse.json({
      info: {
        status: infoRes.status,
        ok: infoRes.ok,
        body: infoBody,
      },
      posts: {
        status: postsRes.status,
        ok: postsRes.ok,
        body: postsSummary,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
