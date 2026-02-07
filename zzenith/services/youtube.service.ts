const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  // --- NEW METRICS ---
  viewCount: string;
  likeCount: string;
  commentCount: string;
  duration: string; // e.g., "PT10M5S"
  tags: string[];   // e.g., ["tech", "review", "apple"]
}

export interface YouTubeChannelData {
  id: string;
  title: string;
  description: string;
  customUrl: string;
  thumbnail: string;
  statistics: {
    viewCount: string;
    subscriberCount: string;
    videoCount: string;
    hiddenSubscriberCount: boolean;
  };
  recentVideos: YouTubeVideo[];
}

export async function fetchYoutubeData(url: string): Promise<YouTubeChannelData | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  try {
    if (!apiKey) throw new Error('YOUTUBE_API_KEY is not defined');

    // 1. Resolve Channel ID
    const identifier = extractIdentifier(url);
    if (!identifier) throw new Error('Invalid YouTube URL');

    const channelId = identifier.startsWith('UC') && identifier.length === 24 
      ? identifier 
      : await resolveHandleToId(identifier, apiKey);

    if (!channelId) throw new Error('Could not resolve Channel ID');

    // 2. Fetch Channel Details (Global Stats)
    const channelDetails = await getChannelDetails(channelId, apiKey);

    // 3. Get Recent Video IDs (from Uploads Playlist)
    const uploadsPlaylistId = channelDetails.contentDetails?.relatedPlaylists?.uploads;
    const recentVideoIds = uploadsPlaylistId 
      ? await getPlaylistVideoIds(uploadsPlaylistId, apiKey) 
      : [];

    // 4. Fetch Deep Metrics for those Videos (Views, Likes, Tags)
    const recentVideos = recentVideoIds.length > 0
      ? await getVideoDetails(recentVideoIds, apiKey)
      : [];

    return {
      id: channelDetails.id,
      title: channelDetails.snippet.title,
      description: channelDetails.snippet.description,
      customUrl: channelDetails.snippet.customUrl,
      thumbnail: channelDetails.snippet.thumbnails.high.url,
      statistics: {
        viewCount: channelDetails.statistics.viewCount,
        subscriberCount: channelDetails.statistics.subscriberCount,
        videoCount: channelDetails.statistics.videoCount,
        hiddenSubscriberCount: channelDetails.statistics.hiddenSubscriberCount
      },
      recentVideos: recentVideos
    };

  } catch (error) {
    console.error('YouTube Service Error:', error);
    throw error;
  }
}

// --- HELPERS ---

function extractIdentifier(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    if (pathSegments[0].startsWith('@')) return pathSegments[0];
    if (pathSegments[0] === 'channel') return pathSegments[1];
    if (['c', 'user'].includes(pathSegments[0])) return pathSegments[1];
    return pathSegments[0];
  } catch (e) {
    return null;
  }
}

async function resolveHandleToId(handle: string, apiKey: string): Promise<string | null> {
  const endpoint = `${BASE_URL}/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${apiKey}`;
  const res = await fetch(endpoint);
  const data = await res.json();
  return data.items?.[0]?.snippet?.channelId || null;
}

async function getChannelDetails(channelId: string, apiKey: string) {
  const endpoint = `${BASE_URL}/channels?part=snippet,contentDetails,statistics&id=${channelId}&key=${apiKey}`;
  const res = await fetch(endpoint);
  const data = await res.json();
  if (!data.items?.length) throw new Error('Channel not found');
  return data.items[0];
}

// Step 3: Get just the IDs from the playlist
async function getPlaylistVideoIds(playlistId: string, apiKey: string): Promise<string[]> {
  const endpoint = `${BASE_URL}/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=10&key=${apiKey}`;
  const res = await fetch(endpoint);
  const data = await res.json();
  if (!data.items) return [];
  return data.items.map((item: any) => item.contentDetails.videoId);
}

// Step 4: Get the rich data for these IDs
async function getVideoDetails(videoIds: string[], apiKey: string): Promise<YouTubeVideo[]> {
  // Join IDs with commas to fetch all in one request (Batching)
  const idsParam = videoIds.join(',');
  const endpoint = `${BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${idsParam}&key=${apiKey}`;
  
  const res = await fetch(endpoint);
  const data = await res.json();

  if (!data.items) return [];

  return data.items.map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
    publishedAt: item.snippet.publishedAt,
    // Rich Data:
    viewCount: item.statistics.viewCount || '0',
    likeCount: item.statistics.likeCount || '0',
    commentCount: item.statistics.commentCount || '0',
    duration: item.contentDetails.duration, // ISO 8601 format (e.g., PT5M30S)
    tags: item.snippet.tags || [] // Array of strings
  }));
}