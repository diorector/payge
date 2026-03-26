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

    return NextResponse.json({
      info: {
        status: infoRes.status,
        ok: infoRes.ok,
        body: infoBody,
      },
      posts: {
        status: postsRes.status,
        ok: postsRes.ok,
        // Truncate posts to avoid massive response
        body: typeof postsBody === "string"
          ? postsBody.slice(0, 3000)
          : JSON.parse(JSON.stringify(postsBody, null, 0).slice(0, 8000)),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
