export interface InstagramCaption {
  text: string;
  timestamp?: string; // ISO date or unix timestamp
  likeCount?: number;
  commentCount?: number;
  mediaType?: string; // "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
}

export interface InstagramProfile {
  username: string;
  fullName: string;
  biography: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isPrivate: boolean;
  profilePicUrl: string;
  externalUrl: string;
  category: string;
  recentCaptions: string[]; // plain text captions for backward compat
  captions: InstagramCaption[]; // rich caption data with engagement metrics
}

/**
 * Scrape public Instagram profile data.
 * Priority:
 *  1. RapidAPI (if RAPIDAPI_KEY set) — most reliable, third-party proxy
 *  2. Authenticated Instagram API (if INSTAGRAM_SESSION_ID set) — direct w/ cookie
 *  3. Unauthenticated Instagram APIs (multiple fallbacks)
 */
export async function scrapeInstagramProfile(
  username: string
): Promise<InstagramProfile | null> {
  const cleanUsername = username.replace("@", "").trim();

  // --- Tier 1: RapidAPI proxy (most reliable, no Instagram blocks) ---
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (rapidApiKey) {
    console.log(`[scraper] Trying RapidAPI for @${cleanUsername}...`);
    const rapidResult = await tryRapidAPI(cleanUsername, rapidApiKey);
    if (rapidResult && rapidResult.captions.length > 0) {
      console.log(`[scraper] RapidAPI success: ${rapidResult.captions.length} captions`);
      return rapidResult;
    }
  }

  // --- Tier 2: Authenticated Instagram API (session cookie) ---
  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  if (sessionId) {
    console.log(`[scraper] Trying authenticated API for @${cleanUsername}...`);
    const authResult = await tryAuthenticatedAPI(cleanUsername, sessionId);
    if (authResult && authResult.captions.length > 0) {
      console.log(`[scraper] Auth API success: ${authResult.captions.length} captions`);
      return authResult;
    }
  }

  // --- Tier 3: Unauthenticated approaches (least reliable) ---
  console.log(`[scraper] Trying unauthenticated approaches for @${cleanUsername}...`);

  const apiResult = await tryWebProfileAPI(cleanUsername);
  if (apiResult && apiResult.captions.length > 0) return apiResult;

  const jsonResult = await tryJSONEndpoint(cleanUsername);
  if (jsonResult && jsonResult.captions.length > 0) return jsonResult;

  const htmlResult = await tryHTMLScrape(cleanUsername);
  if (htmlResult && htmlResult.captions.length > 0) return htmlResult;

  // --- Tier 4: At least get basic profile info ---
  const mobileResult = await tryMobileAPI(cleanUsername);
  if (mobileResult) return mobileResult;

  // Return any partial result (even without captions)
  return apiResult || jsonResult || htmlResult || null;
}

// ========== Tier 1: RapidAPI ==========

const RAPIDAPI_HOST =
  process.env.RAPIDAPI_HOST || "instagram-scraper-stable-api.p.rapidapi.com";

async function tryRapidAPI(
  username: string,
  apiKey: string
): Promise<InstagramProfile | null> {
  // Try the Stable API (POST-based) first, then fall back to API2 (GET-based)
  const stableResult = await tryRapidAPIStable(username, apiKey);
  if (stableResult && stableResult.captions.length > 0) return stableResult;

  const api2Result = await tryRapidAPIv2(username, apiKey);
  if (api2Result && api2Result.captions.length > 0) return api2Result;

  return stableResult || api2Result;
}

// Instagram Scraper Stable API (POST-based)
async function tryRapidAPIStable(
  username: string,
  apiKey: string
): Promise<InstagramProfile | null> {
  const host = "instagram-scraper-stable-api.p.rapidapi.com";
  try {
    // Get profile info
    const infoRes = await fetch(`https://${host}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": host,
      },
      body: JSON.stringify({
        username_or_url: username,
        data: "profile",
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!infoRes.ok) {
      console.log(`[scraper] RapidAPI Stable profile failed: ${infoRes.status}`);
      return null;
    }

    const infoData = await infoRes.json();
    if (infoData?.error) {
      console.log(`[scraper] RapidAPI Stable error: ${infoData.error}`);
      return null;
    }
    const user = infoData?.data || infoData;
    if (!user || (!user.username && !user.full_name)) return null;

    // Get posts
    let captions: InstagramCaption[] = [];
    try {
      const postsRes = await fetch(`https://${host}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": host,
        },
        body: JSON.stringify({
          username_or_url: username,
          data: "posts",
          amount: 25,
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        const items =
          postsData?.data?.items ||
          postsData?.data?.edges?.map((e: { node: unknown }) => e.node) ||
          postsData?.items ||
          postsData?.data ||
          [];
        captions = extractCaptionsFromRapidAPI(
          Array.isArray(items) ? items : []
        );
      }
    } catch {
      // posts fetch failed, continue with profile only
    }

    return {
      username: user.username || username,
      fullName: user.full_name || "",
      biography: user.biography || "",
      followerCount: user.follower_count ?? user.edge_followed_by?.count ?? 0,
      followingCount: user.following_count ?? user.edge_follow?.count ?? 0,
      postCount: user.media_count ?? user.edge_owner_to_timeline_media?.count ?? 0,
      isPrivate: user.is_private ?? false,
      profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url || "",
      externalUrl: user.external_url || "",
      category: user.category_name || user.category || "",
      recentCaptions: captions.map((c) => c.text),
      captions,
    };
  } catch (e) {
    console.log(`[scraper] RapidAPI Stable error:`, e);
    return null;
  }
}

// Instagram Scraper API2 (GET-based, fallback)
async function tryRapidAPIv2(
  username: string,
  apiKey: string
): Promise<InstagramProfile | null> {
  const host = "instagram-scraper-api2.p.rapidapi.com";
  try {
    const infoRes = await fetch(
      `https://${host}/v1/info?username_or_id_or_url=${encodeURIComponent(username)}`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": host,
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!infoRes.ok) return null;

    const infoData = await infoRes.json();
    const user = infoData?.data;
    if (!user) return null;

    const postsRes = await fetch(
      `https://${host}/v1.2/posts?username_or_id_or_url=${encodeURIComponent(username)}`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": host,
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    let captions: InstagramCaption[] = [];
    if (postsRes.ok) {
      const postsData = await postsRes.json();
      const items = postsData?.data?.items || postsData?.data || [];
      captions = extractCaptionsFromRapidAPI(items);
    }

    return {
      username: user.username || username,
      fullName: user.full_name || "",
      biography: user.biography || "",
      followerCount: user.follower_count ?? 0,
      followingCount: user.following_count ?? 0,
      postCount: user.media_count ?? 0,
      isPrivate: user.is_private ?? false,
      profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url || "",
      externalUrl: user.external_url || "",
      category: user.category_name || user.category || "",
      recentCaptions: captions.map((c) => c.text),
      captions,
    };
  } catch {
    return null;
  }
}

function extractCaptionsFromRapidAPI(items: unknown[]): InstagramCaption[] {
  if (!Array.isArray(items)) return [];
  const results: InstagramCaption[] = [];

  for (const item of items.slice(0, MAX_CAPTIONS)) {
    const post = item as Record<string, unknown>;
    const caption = post.caption as Record<string, unknown> | null;
    const text = (caption?.text as string) || "";
    if (!text) continue;

    results.push({
      text,
      timestamp: post.taken_at
        ? new Date((post.taken_at as number) * 1000).toISOString()
        : undefined,
      likeCount: (post.like_count as number) ?? undefined,
      commentCount: (post.comment_count as number) ?? undefined,
      mediaType:
        (post.media_type as number) === 2
          ? "VIDEO"
          : (post.media_type as number) === 8
            ? "CAROUSEL_ALBUM"
            : "IMAGE",
    });
  }
  return results;
}

// ========== Tier 2: Authenticated Instagram API ==========

async function tryAuthenticatedAPI(
  username: string,
  sessionId: string
): Promise<InstagramProfile | null> {
  try {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    const res = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        "X-IG-App-ID": "936619743392459",
        "X-Requested-With": "XMLHttpRequest",
        Cookie: `sessionid=${sessionId}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const user = data?.data?.user;
    if (!user) return null;

    const captions = extractRichCaptionsFromEdges(
      user.edge_owner_to_timeline_media?.edges
    );

    return {
      username: user.username,
      fullName: user.full_name || "",
      biography: user.biography || "",
      followerCount: user.edge_followed_by?.count ?? 0,
      followingCount: user.edge_follow?.count ?? 0,
      postCount: user.edge_owner_to_timeline_media?.count ?? 0,
      isPrivate: user.is_private ?? false,
      profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url || "",
      externalUrl: user.external_url || "",
      category: user.category_name || "",
      recentCaptions: captions.map((c) => c.text),
      captions,
    };
  } catch {
    return null;
  }
}

// ========== Tier 3: Unauthenticated approaches ==========

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Cache-Control": "no-cache",
};

async function tryWebProfileAPI(
  username: string
): Promise<InstagramProfile | null> {
  try {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    const res = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        "X-IG-App-ID": "936619743392459",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const user = data?.data?.user;
    if (!user) return null;

    const captions = extractRichCaptionsFromEdges(
      user.edge_owner_to_timeline_media?.edges
    );

    return {
      username: user.username,
      fullName: user.full_name || "",
      biography: user.biography || "",
      followerCount: user.edge_followed_by?.count ?? 0,
      followingCount: user.edge_follow?.count ?? 0,
      postCount: user.edge_owner_to_timeline_media?.count ?? 0,
      isPrivate: user.is_private ?? false,
      profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url || "",
      externalUrl: user.external_url || "",
      category: user.category_name || "",
      recentCaptions: captions.map((c) => c.text),
      captions,
    };
  } catch {
    return null;
  }
}

async function tryJSONEndpoint(
  username: string
): Promise<InstagramProfile | null> {
  try {
    const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;
    const res = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        "X-IG-App-ID": "936619743392459",
        "X-Requested-With": "XMLHttpRequest",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const user = data?.graphql?.user ?? data?.user;
    if (!user) return null;

    const captions = extractRichCaptionsFromEdges(
      user.edge_owner_to_timeline_media?.edges
    );

    return {
      username: user.username || username,
      fullName: user.full_name || "",
      biography: user.biography || "",
      followerCount: user.edge_followed_by?.count ?? 0,
      followingCount: user.edge_follow?.count ?? 0,
      postCount: user.edge_owner_to_timeline_media?.count ?? 0,
      isPrivate: user.is_private ?? false,
      profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url || "",
      externalUrl: user.external_url || "",
      category: user.category_name || "",
      recentCaptions: captions.map((c) => c.text),
      captions,
    };
  } catch {
    return null;
  }
}

async function tryHTMLScrape(
  username: string
): Promise<InstagramProfile | null> {
  try {
    const url = `https://www.instagram.com/${username}/`;
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Extract from meta tags
    const biography = extractMeta(html, "og:description") || "";
    const fullName = extractMeta(html, "og:title")?.replace(/ \(@.*$/, "") || "";

    // Try to extract embedded JSON data
    const sharedDataMatch = html.match(
      new RegExp("window\\._sharedData\\s*=\\s*(\\{.+?\\});</script>", "s")
    );
    const additionalDataMatch = html.match(
      new RegExp("window\\.__additionalDataLoaded\\s*\\([^,]+,\\s*(\\{.+?\\})\\s*\\)", "s")
    );

    let user: Record<string, unknown> | null = null;

    if (sharedDataMatch) {
      try {
        const sharedData = JSON.parse(sharedDataMatch[1]);
        user =
          sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user ?? null;
      } catch {
        // ignore parse error
      }
    }

    if (!user && additionalDataMatch) {
      try {
        const additionalData = JSON.parse(additionalDataMatch[1]);
        user = additionalData?.graphql?.user ?? additionalData?.user ?? null;
      } catch {
        // ignore parse error
      }
    }

    // Parse follower counts from og:description
    const statsMatch = biography.match(
      /(\d[\d,.KkMm]*)\s*(?:Followers|팔로워)/i
    );
    const followingMatch = biography.match(
      /(\d[\d,.KkMm]*)\s*(?:Following|팔로잉)/i
    );
    const postsMatch = biography.match(
      /(\d[\d,.KkMm]*)\s*(?:Posts|게시물)/i
    );

    if (user) {
      const edges = (
        user as { edge_owner_to_timeline_media?: { edges?: unknown[] } }
      ).edge_owner_to_timeline_media?.edges;
      const captions = extractRichCaptionsFromEdges(edges as unknown[]);
      return {
        username,
        fullName:
          (user as { full_name?: string }).full_name || fullName,
        biography:
          (user as { biography?: string }).biography || cleanBioFromOG(biography),
        followerCount:
          (
            user as {
              edge_followed_by?: { count?: number };
            }
          ).edge_followed_by?.count ?? parseCount(statsMatch?.[1]),
        followingCount:
          (
            user as {
              edge_follow?: { count?: number };
            }
          ).edge_follow?.count ?? parseCount(followingMatch?.[1]),
        postCount:
          (
            user as {
              edge_owner_to_timeline_media?: { count?: number };
            }
          ).edge_owner_to_timeline_media?.count ??
          parseCount(postsMatch?.[1]),
        isPrivate: (user as { is_private?: boolean }).is_private ?? false,
        profilePicUrl:
          (user as { profile_pic_url_hd?: string }).profile_pic_url_hd || "",
        externalUrl: (user as { external_url?: string }).external_url || "",
        category: (user as { category_name?: string }).category_name || "",
        recentCaptions: captions.map((c) => c.text),
        captions,
      };
    }

    // Fallback: at least return what meta tags give us
    if (fullName || biography) {
      return {
        username,
        fullName,
        biography: cleanBioFromOG(biography),
        followerCount: parseCount(statsMatch?.[1]),
        followingCount: parseCount(followingMatch?.[1]),
        postCount: parseCount(postsMatch?.[1]),
        isPrivate: false,
        profilePicUrl: extractMeta(html, "og:image") || "",
        externalUrl: "",
        category: "",
        recentCaptions: [],
        captions: [],
      };
    }

    return null;
  } catch {
    return null;
  }
}

async function tryMobileAPI(
  username: string
): Promise<InstagramProfile | null> {
  try {
    const searchUrl = `https://www.instagram.com/web/search/topsearch/?query=${username}`;
    const res = await fetch(searchUrl, {
      headers: {
        ...BROWSER_HEADERS,
        "X-IG-App-ID": "936619743392459",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const matchedUser = data?.users?.find(
      (u: { user: { username: string } }) =>
        u.user.username.toLowerCase() === username.toLowerCase()
    );

    if (!matchedUser) return null;

    const user = matchedUser.user;
    return {
      username: user.username,
      fullName: user.full_name || "",
      biography: "",
      followerCount: user.follower_count ?? 0,
      followingCount: 0,
      postCount: 0,
      isPrivate: user.is_private ?? false,
      profilePicUrl: user.profile_pic_url || "",
      externalUrl: "",
      category: "",
      recentCaptions: [],
      captions: [],
    };
  } catch {
    return null;
  }
}

// ========== Shared Utilities ==========

const MAX_CAPTIONS = 25;

interface EdgeNode {
  node?: {
    edge_media_to_caption?: { edges?: { node?: { text?: string } }[] };
    taken_at_timestamp?: number;
    edge_liked_by?: { count?: number };
    edge_media_preview_like?: { count?: number };
    edge_media_to_comment?: { count?: number };
    __typename?: string;
    is_video?: boolean;
  };
}

function extractRichCaptionsFromEdges(
  edges: unknown[] | undefined
): InstagramCaption[] {
  if (!Array.isArray(edges)) return [];
  const results: InstagramCaption[] = [];
  for (const edge of (edges as EdgeNode[]).slice(0, MAX_CAPTIONS)) {
    const node = edge.node;
    const text =
      node?.edge_media_to_caption?.edges?.[0]?.node?.text ?? "";
    if (!text) continue;

    results.push({
      text,
      timestamp: node?.taken_at_timestamp
        ? new Date(node.taken_at_timestamp * 1000).toISOString()
        : undefined,
      likeCount:
        node?.edge_liked_by?.count ??
        node?.edge_media_preview_like?.count,
      commentCount: node?.edge_media_to_comment?.count,
      mediaType: node?.is_video
        ? "VIDEO"
        : node?.__typename === "GraphSidecar"
          ? "CAROUSEL_ALBUM"
          : "IMAGE",
    });
  }
  return results;
}

function extractMeta(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*?)["']`,
    "i"
  );
  const match = html.match(regex);
  if (match) return decodeHTMLEntities(match[1]);

  const nameRegex = new RegExp(
    `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*?)["']`,
    "i"
  );
  const nameMatch = html.match(nameRegex);
  return nameMatch ? decodeHTMLEntities(nameMatch[1]) : null;
}

function decodeHTMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function cleanBioFromOG(ogDescription: string): string {
  const parts = ogDescription.split(" - ");
  if (parts.length > 1) {
    const bio = parts
      .slice(1)
      .join(" - ")
      .replace(/See Instagram photos and videos from .+$/, "")
      .trim();
    return bio || "";
  }
  return ogDescription;
}

function parseCount(str: string | undefined): number {
  if (!str) return 0;
  const clean = str.replace(/,/g, "");
  if (clean.match(/[kK]$/)) return Math.round(parseFloat(clean) * 1000);
  if (clean.match(/[mM]$/)) return Math.round(parseFloat(clean) * 1000000);
  return parseInt(clean, 10) || 0;
}

/**
 * Format scraped profile data into a readable string for AI analysis.
 */
export function formatProfileForAI(profile: InstagramProfile): string {
  const sections: string[] = [];

  sections.push(`## 인스타그램 프로필: @${profile.username}`);

  if (profile.fullName) {
    sections.push(`이름: ${profile.fullName}`);
  }
  if (profile.category) {
    sections.push(`카테고리: ${profile.category}`);
  }
  if (profile.biography) {
    sections.push(`바이오:\n"${profile.biography}"`);
  }

  sections.push(
    `팔로워: ${profile.followerCount.toLocaleString()} | 팔로잉: ${profile.followingCount.toLocaleString()} | 게시물: ${profile.postCount.toLocaleString()}`
  );

  if (profile.externalUrl) {
    sections.push(`외부 링크: ${profile.externalUrl}`);
  }

  if (profile.captions.length > 0) {
    sections.push(`\n## 최근 게시물 (${profile.captions.length}개)`);
    profile.captions.forEach((caption, i) => {
      const truncated =
        caption.text.length > 500
          ? caption.text.slice(0, 500) + "..."
          : caption.text;

      const meta: string[] = [];
      if (caption.mediaType) meta.push(`타입: ${caption.mediaType}`);
      if (caption.likeCount !== undefined)
        meta.push(`좋아요: ${caption.likeCount}`);
      if (caption.commentCount !== undefined)
        meta.push(`댓글: ${caption.commentCount}`);
      if (caption.timestamp) {
        const date = new Date(caption.timestamp);
        meta.push(`날짜: ${date.toISOString().split("T")[0]}`);
      }

      sections.push(
        `\n### 게시물 ${i + 1}${meta.length > 0 ? ` (${meta.join(", ")})` : ""}\n"${truncated}"`
      );
    });
  } else if (profile.recentCaptions.length > 0) {
    sections.push(
      `\n## 최근 게시물 캡션 (${profile.recentCaptions.length}개)`
    );
    profile.recentCaptions.forEach((caption, i) => {
      const truncated =
        caption.length > 500 ? caption.slice(0, 500) + "..." : caption;
      sections.push(`\n### 게시물 ${i + 1}\n"${truncated}"`);
    });
  }

  return sections.join("\n");
}
