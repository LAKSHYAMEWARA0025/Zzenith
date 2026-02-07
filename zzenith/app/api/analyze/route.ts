import { NextResponse } from 'next/server';
import { fetchYoutubeData } from '@/services/youtube.service'; 
import { fetchInstagramData } from '@/services/instagram.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { youtubeUrl, instagramUrl } = body;

    if (!youtubeUrl && !instagramUrl) {
      return NextResponse.json(
        { error: 'At least one platform link is required' },
        { status: 400 }
      );
    }

    const results = {
      youtube: null as any,
      instagram: null as any,
      errors: [] as string[]
    };

    const tasks = [];

    // --- REAL YOUTUBE FETCH ---
    if (youtubeUrl) {
      console.log('Fetching YouTube Data for:', youtubeUrl); // Debug Log
      tasks.push(
        fetchYoutubeData(youtubeUrl)
          .then(data => ({ type: 'youtube', data }))
      );
    }

    // --- REAL INSTAGRAM FETCH ---
    if (instagramUrl) {
      console.log('Fetching Instagram Data for:', instagramUrl); // Debug Log
      tasks.push(
        fetchInstagramData(instagramUrl)
          .then(data => ({ type: 'instagram', data }))
      );
    }

    const outcomes = await Promise.allSettled(tasks);

    outcomes.forEach((outcome) => {
      if (outcome.status === 'fulfilled') {
        const { type, data } = outcome.value as any;
        if (type === 'youtube') results.youtube = data;
        if (type === 'instagram') results.instagram = data;
      } else {
        console.error('Analysis failed:', outcome.reason);
        results.errors.push(outcome.reason?.message || 'Unknown error');
      }
    });

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('API Critical Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}