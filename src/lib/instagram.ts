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
  recentCaptions: string[]; // up to ~12 recent post captions
}

/**
 * Scrape public Instagram profile data.
 * Tries multiple approaches in order of reliability.
 */
export async function scrapeInstagramProfile(
  username: string
): Promise<InstagramProfile | null> {
  const cleanUsername = username.replace("@", "").trim();

  // Approach 1: Try the web profile info API
  const apiResult = await tryWebProfileAPI(cleanUsername);
  if (apiResult) return apiResult;

  // Approach 2: Try scraping the HTML page meta tags + embedded JSON
  const htmlResult = await tryHTMLScrape(cleanUsername);
  if (htmlResult) return htmlResult;

  // Approach 3: Try the i.instagram.com mobile-style endpoint
  const mobileResult = await tryMobileAPI(cleanUsername);
  if (mobileResult) return mobileResult;

  return null;
}

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

    const recentCaptions = extractCaptionsFromEdges(
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
      recentCaptions,
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
    // Format: "123 Followers, 45 Following, 67 Posts - See Instagram photos..."
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
        recentCaptions: extractCaptionsFromEdges(edges as unknown[]),
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
    };
  } catch {
    return null;
  }
}

function extractCaptionsFromEdges(edges: unknown[] | undefined): string[] {
  if (!Array.isArray(edges)) return [];
  return edges
    .slice(0, 12)
    .map((edge) => {
      const node = (edge as { node?: { edge_media_to_caption?: { edges?: { node?: { text?: string } }[] } } }).node;
      return node?.edge_media_to_caption?.edges?.[0]?.node?.text ?? "";
    })
    .filter((caption) => caption.length > 0);
}

function extractMeta(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*?)["']`,
    "i"
  );
  const match = html.match(regex);
  if (match) return decodeHTMLEntities(match[1]);

  // Try name attribute too
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
  // OG description format: "123 Followers, 45 Following, 67 Posts - See Instagram photos and videos from Name (@user)"
  // We want to extract just the bio part if present
  const parts = ogDescription.split(" - ");
  if (parts.length > 1) {
    // Remove the "See Instagram photos..." suffix
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

  if (profile.recentCaptions.length > 0) {
    sections.push(`\n## 최근 게시물 캡션 (${profile.recentCaptions.length}개)`);
    profile.recentCaptions.forEach((caption, i) => {
      // Truncate very long captions
      const truncated =
        caption.length > 500 ? caption.slice(0, 500) + "..." : caption;
      sections.push(`\n### 게시물 ${i + 1}\n"${truncated}"`);
    });
  }

  return sections.join("\n");
}
