export interface InstagramPost {
  id: string;
  caption: string;
  url: string;
  thumbnail: string;
  likes: number;
  comments: number;
  isVideo: boolean;
}

export interface InstagramProfile {
  username: string;
  fullName: string;
  biography: string;
  profilePicUrl: string;
  followers: number;
  following: number;
  postsCount: number;
  recentPosts: InstagramPost[];
  isPrivate: boolean;
}

/**
 * Option 1: Simple Public Scraping
 * Fetches the HTML and parses shared data JSON or Meta Tags.
 */
export async function fetchInstagramData(url: string): Promise<InstagramProfile | null> {
  try {
    const username = extractUsername(url);
    if (!username) throw new Error('Invalid Instagram URL');

    // Headers are critical to look like a real browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    };

    const response = await fetch(`https://www.instagram.com/${username}/`, { headers });
    
    if (!response.ok) {
      // If 404, user doesn't exist. If 302, likely a login redirect (blocking).
      console.warn(`Instagram fetch failed: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // --- STRATEGY A: META TAG PARSING (Most Reliable for Stats) ---
    const metaStats = parseMetaTags(html);

    // --- STRATEGY B: JSON DATA PARSING (For Bio & Posts) ---
    // Instagram embeds data in script tags. We look for the one containing profile info.
    const jsonStats = parseSharedData(html);

    // Merge strategies (JSON is better if found, Meta is fallback)
    return {
      username,
      fullName: jsonStats.fullName || metaStats.fullName || username,
      biography: jsonStats.biography || '',
      profilePicUrl: jsonStats.profilePicUrl || metaStats.image || '',
      followers: jsonStats.followers || metaStats.followers,
      following: jsonStats.following || metaStats.following,
      postsCount: jsonStats.postsCount || metaStats.postsCount,
      recentPosts: jsonStats.recentPosts, // Only available via JSON strategy
      isPrivate: false 
    };

  } catch (error) {
    console.error('Instagram Scraper Error:', error);
    return null;
  }
}

// --- PARSERS ---

function extractUsername(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    return parts[0] || null;
  } catch (e) {
    return null;
  }
}

function parseMetaTags(html: string) {
  // Format: "100 Followers, 50 Following, 10 Posts - See Instagram photos..."
  const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
  const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  const titleMatch = html.match(/<title>(.*?)<\/title>/);

  let followers = 0;
  let following = 0;
  let postsCount = 0;
  let fullName = '';

  if (descMatch && descMatch[1]) {
    const stats = descMatch[1].split(' - ')[0];
    const parts = stats.split(', ');
    
    parts.forEach(p => {
      const val = parseInt(p.replace(/,/g, '').split(' ')[0]);
      if (p.includes('Follower')) followers = val;
      if (p.includes('Following')) following = val;
      if (p.includes('Post')) postsCount = val;
    });
  }

  if (titleMatch && titleMatch[1]) {
    const titleParts = titleMatch[1].split(' (@');
    if (titleParts.length > 0) fullName = titleParts[0];
  }

  return { followers, following, postsCount, fullName, image: imageMatch?.[1] };
}

function parseSharedData(html: string) {
  // Try to find the JSON blob usually inside a script tag containing "graphql" or "user"
  // Note: This is fragile. Instagram changes keys often.
  // We look for a pattern like: <script ...>...{"user":{...}}...</script>
  
  // Basic empty structure
  const result = {
    fullName: '', biography: '', profilePicUrl: '',
    followers: 0, following: 0, postsCount: 0, recentPosts: [] as InstagramPost[]
  };

  try {
    // Attempt to find the specific script containing profile data
    // Usually defined as window._sharedData = {...}
    const scriptRegex = /window\._sharedData\s*=\s*({.+?});<\/script>/;
    const match = html.match(scriptRegex);

    if (match && match[1]) {
      const data = JSON.parse(match[1]);
      const user = data?.entry_data?.ProfilePage?.[0]?.graphql?.user;

      if (user) {
        result.fullName = user.full_name;
        result.biography = user.biography;
        result.profilePicUrl = user.profile_pic_url_hd || user.profile_pic_url;
        result.followers = user.edge_followed_by?.count || 0;
        result.following = user.edge_follow?.count || 0;
        result.postsCount = user.edge_owner_to_timeline_media?.count || 0;

        // Parse recent posts (edges)
        const edges = user.edge_owner_to_timeline_media?.edges || [];
        result.recentPosts = edges.map((edge: any) => ({
          id: edge.node.id,
          caption: edge.node.edge_media_to_caption?.edges[0]?.node?.text || '',
          url: `https://instagram.com/p/${edge.node.shortcode}/`,
          thumbnail: edge.node.display_url,
          likes: edge.node.edge_liked_by?.count || 0,
          comments: edge.node.edge_media_to_comment?.count || 0,
          isVideo: edge.node.is_video
        }));
      }
    }
  } catch (e) {
    // JSON parsing failed or structure changed
    // We fail silently and rely on the Meta Tag fallback
  }

  return result;
}