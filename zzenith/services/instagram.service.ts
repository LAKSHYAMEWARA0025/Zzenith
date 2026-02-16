import { ApifyClient } from 'apify-client';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

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
  engagementRate?: number;
}

export async function fetchInstagramData(url: string): Promise<InstagramProfile | null> {
  if (!APIFY_TOKEN) {
    console.error('❌ APIFY_API_TOKEN is missing');
    return null;
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  try {
    const username = extractUsername(url);
    if (!username) {
        console.error("❌ Could not extract username from URL:", url);
        return null;
    }

    console.log(`[Instagram] Starting Scraper for: ${username}`);

    // Run the Actor
    const run = await client.actor('apify/instagram-profile-scraper').call({
      usernames: [username],
    });

    console.log(`[Instagram] Scraper Finished. Run ID: ${run.id}`);

    // Get Results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // --- DEBUG LOGGING ---
    if (!items || items.length === 0) {
      console.warn(`[Instagram] ⚠️ Apify returned 0 items. Input username might be invalid or IG blocked the request.`);
      return null; // <--- THIS IS LIKELY WHERE IT FAILS
    }

    const profile = items[0] as any;
    
    // Check if we actually got profile data or just garbage
    if (!profile.username) {
        console.warn(`[Instagram] ⚠️ Item returned but 'username' field is missing. Raw Item:`, profile);
        return null;
    }

    // --- DATA TRANSFORMATION ---
    const rawPosts = profile.latestPosts || [];
    console.log(`[Instagram] Found ${rawPosts.length} posts for ${username}`);

    const recentPosts: InstagramPost[] = rawPosts.map((post: any) => ({
      id: post.id,
      caption: post.caption || '',
      url: post.url || `https://www.instagram.com/p/${post.shortCode}/`,
      thumbnail: post.displayUrl || post.thumbnailUrl || '',
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      isVideo: post.isVideo || false
    })).slice(0, 6);

    // Calculate Engagement
    const totalLikes = recentPosts.reduce((sum, p) => sum + p.likes, 0);
    const avgLikes = recentPosts.length > 0 ? totalLikes / recentPosts.length : 0;
    const engagementRate = profile.followersCount > 0 
      ? (avgLikes / profile.followersCount) * 100 
      : 0;

    // --- FINAL SUCCESS LOG ---
    console.log(`[Instagram] ✅ Successfully parsed data for ${username}. Followers: ${profile.followersCount}`);

    return {
      username: profile.username || username,
      fullName: profile.fullName || '',
      biography: profile.biography || '',
      profilePicUrl: profile.profilePicUrlHD || profile.profilePicUrl || '',
      followers: profile.followersCount || 0,
      following: profile.followsCount || 0,
      postsCount: profile.postsCount || 0,
      recentPosts: recentPosts,
      isPrivate: profile.isPrivate || false,
      engagementRate: parseFloat(engagementRate.toFixed(2))
    };

  } catch (error) {
    console.error('[Instagram] ❌ Scraper Error:', error);
    return null;
  }
}

function extractUsername(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    return parts[0];
  } catch (e) {
    return null;
  }
}