import { supabaseAdmin } from '@/lib/supabase';

export const dbService = {

  // 1. GET CREATOR (Fixed for One-to-One Relationship)
  async getCreator(handle: string) {
    const { data, error } = await supabaseAdmin
      .from('creators')
      .select(`
        *,
        youtube_stats(*),
        instagram_stats(*),
        ai_personas(*)
      `)
      .eq('search_handle', handle.toLowerCase())
      .single();

    if (error || !data) return null;

    // FIX: Handle both Array (legacy) and Object (new) formats safely
    const ytStats = Array.isArray(data.youtube_stats) ? data.youtube_stats[0] : data.youtube_stats;
    const igStats = Array.isArray(data.instagram_stats) ? data.instagram_stats[0] : data.instagram_stats;

    console.log(`[DB READ] Found ${handle}. YT Data: ${!!ytStats}, IG Data: ${!!igStats}`);

    // Check if we have data for at least one platform
    if (ytStats || igStats) {
       return { data, hasData: true };
    }

    return { data, hasData: false }; 
  },

  // 2. SAVE ANALYSIS (No changes needed here, but included for completeness)
  async saveAnalysis(handle: string, ytData: any, igData: any, persona: any) {
    console.log(`[DB] Saving analysis for: ${handle}`);
    const cleanHandle = handle.toLowerCase();
    
    const newInsightNote = {
      date: new Date().toISOString(),
      summary: persona?.summary || 'No summary',
      engagement_score: persona?.engagement?.rate || 'N/A'
    };

    const { data: existing } = await supabaseAdmin
      .from('creators')
      .select('insight_history')
      .eq('search_handle', cleanHandle)
      .single();
    const history = existing?.insight_history || [];
    
    const { data: creator, error } = await supabaseAdmin
      .from('creators')
      .upsert({
        search_handle: cleanHandle,
        name: ytData?.title || igData?.fullName || cleanHandle,
        avatar_url: ytData?.thumbnail || igData?.profilePicUrl,
        insight_history: [...history, newInsightNote],
        last_updated: new Date().toISOString()
      }, { onConflict: 'search_handle' })
      .select()
      .single();

    if (error) {
      console.error('[DB] Creator Save Failed:', error);
      return;
    }

    const creatorId = creator.id;

    if (ytData) {
      await supabaseAdmin.from('youtube_stats').upsert({
        creator_id: creatorId,
        subscriber_count: ytData.statistics?.subscriberCount,
        view_count: ytData.statistics?.viewCount,
        video_count: ytData.statistics?.videoCount,
        recent_videos: ytData.recentVideos,
        updated_at: new Date().toISOString()
      }, { onConflict: 'creator_id' });
    }

    if (igData) {
      await supabaseAdmin.from('instagram_stats').upsert({
        creator_id: creatorId,
        username: igData.username,
        follower_count: igData.followers,
        engagement_rate: igData.engagementRate,
        recent_posts: igData.recentPosts,
        updated_at: new Date().toISOString()
      }, { onConflict: 'creator_id' });
    }

    if (persona) {
      await supabaseAdmin.from('ai_personas').upsert({
        creator_id: creatorId,
        archetype: persona.archetype,
        summary: persona.summary,
        full_report: persona,
        updated_at: new Date().toISOString()
      }, { onConflict: 'creator_id' });
    }
    console.log(`[DB] ✅ Saved ${handle}`);
  }
};