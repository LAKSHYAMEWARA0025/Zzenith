import { NextResponse } from 'next/server';
import { fetchYoutubeData } from '@/services/youtube.service';
import { fetchInstagramData } from '@/services/instagram.service';
import { generatePersona } from '@/services/persona.service'; // <--- NEW IMPORT

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
      persona: null as any, // <--- Placeholder for AI Result
      errors: [] as string[]
    };

    const tasks = [];

    // --- REAL YOUTUBE FETCH ---
    if (youtubeUrl) {
      console.log('Fetching YouTube Data for:', youtubeUrl);
      tasks.push(
        fetchYoutubeData(youtubeUrl)
          .then(data => ({ type: 'youtube', data }))
      );
    }

    // --- REAL INSTAGRAM FETCH ---
    if (instagramUrl) {
      console.log('Fetching Instagram Data for:', instagramUrl);
      tasks.push(
        fetchInstagramData(instagramUrl)
          .then(data => ({ type: 'instagram', data }))
      );
    }

    // Wait for both fetchers to finish (Success or Fail)
    const outcomes = await Promise.allSettled(tasks);

    // Process Fetch Results
    outcomes.forEach((outcome) => {
      if (outcome.status === 'fulfilled') {
        // "outcome.value" is the object we returned in the .then() above
        const result = outcome.value as any; 
        
        if (result.type === 'youtube') {
             results.youtube = result.data;
        }
        if (result.type === 'instagram') {
             results.instagram = result.data;
        }
      } else {
        console.error('Analysis failed:', outcome.reason);
        results.errors.push(outcome.reason?.message || 'Unknown fetch error');
      }
    });

    // --- NEW STEP: GENERATE AI PERSONA ---
    // We pass whatever data we successfully got. The AI service handles nulls.
    try {
        console.log('Generating AI Persona...');
        results.persona = await generatePersona(results.youtube, results.instagram);
    } catch (aiError) {
        console.error('AI Generation failed:', aiError);
        // We don't crash the whole app if AI fails, just log it.
        results.errors.push('AI Persona generation failed');
    }

    // Return the bundle
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