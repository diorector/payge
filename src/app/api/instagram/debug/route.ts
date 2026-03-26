import { NextRequest, NextResponse } from "next/server";

// GET /api/instagram/debug?username=kimdohyungg
// Tries multiple possible RapidAPI endpoint patterns and returns results
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

  // Try many possible endpoint patterns
  const endpoints = [
    `/v1/info?username_or_id=${username}`,
    `/v1/posts?username_or_id=${username}`,
    `/v2/info?username_or_id=${username}`,
    `/v2/posts?username_or_id=${username}`,
    `/info?username_or_id=${username}`,
    `/posts?username_or_id=${username}`,
    `/user/info?username=${username}`,
    `/user/posts?username=${username}`,
    `/profile?username=${username}`,
    `/user?username=${username}`,
    `/${username}`,
    `/user/${username}`,
    `/profile/${username}`,
    `/v1/user/${username}`,
    `/v1/profile?username=${username}`,
    `/v1/user?username=${username}`,
    `/api/profile?username=${username}`,
    `/instagram/user/${username}`,
    `/user/info?username_or_id_or_url=${username}`,
  ];

  const results: Record<string, { status: number; body: string }> = {};

  // Run all in parallel
  const promises = endpoints.map(async (endpoint) => {
    try {
      const res = await fetch(`https://${host}${endpoint}`, {
        headers,
        signal: AbortSignal.timeout(10000),
      });
      const text = await res.text();
      results[endpoint] = {
        status: res.status,
        body: text.slice(0, 500),
      };
    } catch (e) {
      results[endpoint] = {
        status: 0,
        body: `Error: ${String(e).slice(0, 200)}`,
      };
    }
  });

  await Promise.all(promises);

  return NextResponse.json({ username, results });
}
