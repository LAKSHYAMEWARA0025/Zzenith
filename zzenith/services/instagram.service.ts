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
  engagementRate?: number; // New metric we will calculate
}

export async function fetchInstagramData(url: string): Promise<InstagramProfile | null> {
  if (!APIFY_TOKEN) {
    console.error('APIFY_API_TOKEN is missing');
    return null;
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  try {
    // 1. Extract Username
    const username = extractUsername(url);
    if (!username) throw new Error('Invalid Username');

    // 2. Call the PROFILE Scraper (Better for Stats)
    // We use "apify/instagram-profile-scraper"
    const run = await client.actor('apify/instagram-profile-scraper').call({
      usernames: [username], // It takes a list of usernames
    });

    // 3. Get Results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    // console.log(items);
    
    if (!items || items.length === 0) {
      console.warn('Apify returned no profile data.');
      return null;
    }

    const profile = items[0] as any;

    // 4. Transform Data
    // This actor returns "latestPosts" inside the profile object
    const rawPosts = profile.latestPosts || [];
    
    const recentPosts: InstagramPost[] = rawPosts.map((post: any) => ({
      id: post.id,
      caption: post.caption || '',
      url: post.url || `https://www.instagram.com/p/${post.shortCode}/`,
      thumbnail: post.displayUrl || post.thumbnailUrl || '',
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      isVideo: post.isVideo || false
    })).slice(0, 6); // Take top 6

    // 5. Calculate "Derived Metrics" for Personalization
    const totalLikes = recentPosts.reduce((sum, p) => sum + p.likes, 0);
    const avgLikes = recentPosts.length > 0 ? totalLikes / recentPosts.length : 0;
    
    // Engagement Rate = (Avg Likes / Followers) * 100
    // This is a key "Persona" metric
    const engagementRate = profile.followersCount > 0 
      ? (avgLikes / profile.followersCount) * 100 
      : 0;

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
      engagementRate: parseFloat(engagementRate.toFixed(2)) // Keep it clean (e.g., 2.54%)
    };

  } catch (error) {
    console.error('Apify Profile Scraper Error:', error);
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