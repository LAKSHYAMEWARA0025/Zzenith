import { NextResponse } from 'next/server';
import { fetchYoutubeData } from '@/services/youtube.service';
import { fetchInstagramData } from '@/services/instagram.service';
import { generatePersona } from '@/services/persona.service';
import { dbService } from '@/services/db.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { youtubeUrl, instagramUrl, forceRefresh } = body;

    // 1. ROBUST HANDLE PARSING
    let handle = 'unknown';

    if (instagramUrl) {
      try {
        const urlObj = new URL(instagramUrl);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        handle = parts[0] || 'unknown'; 
      } catch (e) {
        console.error('Invalid Instagram URL');
      }
    } else if (youtubeUrl) {
      try {
        const urlObj = new URL(youtubeUrl);
        if (urlObj.pathname.startsWith('/@')) {
           handle = urlObj.pathname.slice(2).split('/')[0];
        } else {
           handle = urlObj.pathname.split('/').filter(Boolean).pop() || 'unknown';
        }
      } catch (e) {
        console.error('Invalid YouTube URL');
      }
    }

    handle = handle.toLowerCase().trim();
    console.log(`🔍 Analyzing Handle: "${handle}"`);

    // 2. CHECK DATABASE
    if (!forceRefresh && handle !== 'unknown') {
      const cached = await dbService.getCreator(handle);
      
      if (cached && cached.hasData) {
        console.log(`⚡ HIT: Serving ${handle} from DB`);
        
        // FIX: Handle Object vs Array response automatically
        const ytStats = Array.isArray(cached.data.youtube_stats) 
          ? cached.data.youtube_stats[0] 
          : cached.data.youtube_stats;

        const igStats = Array.isArray(cached.data.instagram_stats) 
          ? cached.data.instagram_stats[0] 
          : cached.data.instagram_stats;

        const aiPersona = Array.isArray(cached.data.ai_personas)
          ? cached.data.ai_personas[0]
          : cached.data.ai_personas;

        // Robust Data Mapping
        const mappedData = {
          youtube: ytStats ? {
            title: cached.data.name || 'Unknown Creator',
            thumbnail: cached.data.avatar_url || '', 
            statistics: {
              subscriberCount: ytStats.subscriber_count || '0',
              viewCount: ytStats.view_count || '0',
              videoCount: ytStats.video_count || '0'
            },
            recentVideos: Array.isArray(ytStats.recent_videos) ? ytStats.recent_videos : []
          } : null,

          instagram: igStats ? {
            username: igStats.username || handle,
            fullName: cached.data.name || handle,
            profilePicUrl: cached.data.avatar_url || '',
            followers: igStats.follower_count || 0,
            engagementRate: igStats.engagement_rate || 0,
            recentPosts: Array.isArray(igStats.recent_posts) ? igStats.recent_posts : []
          } : null,

          persona: aiPersona?.full_report || null
        };

        return NextResponse.json({ success: true, data: mappedData });
      }
    }

    // 3. FETCH FRESH DATA
    console.log(`🔄 MISS: Fetching live APIs for ${handle}...`);
    
    const [ytRes, igRes] = await Promise.allSettled([
      youtubeUrl ? fetchYoutubeData(youtubeUrl) : Promise.resolve(null),
      instagramUrl ? fetchInstagramData(instagramUrl) : Promise.resolve(null)
    ]);

    const youtubeData = ytRes.status === 'fulfilled' ? (ytRes.value as any) : null;
    const instagramData = igRes.status === 'fulfilled' ? (igRes.value as any) : null;
    
    if (youtubeData) console.log(`✅ YouTube Fetch Success: ${youtubeData.title}`);
    if (instagramData) console.log(`✅ Instagram Fetch Success: ${instagramData.username}`);

    if (!youtubeData && !instagramData) {
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 400 });
    }

    // 4. GENERATE AI PERSONA
    let persona = null;
    try {
      persona = await generatePersona(youtubeData, instagramData);
    } catch (e) {
      console.error('AI Gen Failed', e);
    }

    // 5. SAVE TO DB
    if (handle !== 'unknown') {
      try {
        await dbService.saveAnalysis(handle, youtubeData, instagramData, persona);
        console.log(`💾 Save Complete.`);
      } catch (dbError) {
        console.error('❌ DB Save Failed:', dbError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        youtube: youtubeData,
        instagram: instagramData,
        persona: persona
      } 
    });

  } catch (error: any) {
    console.error('API Critical Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}