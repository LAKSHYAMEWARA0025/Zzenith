import { GoogleGenerativeAI } from '@google/generative-ai';
import { YouTubeChannelData } from './youtube.service';
import { InstagramProfile } from './instagram.service';

// 1. Define the exact structure you asked for
export interface CreatorPersona {
  niche: {
    primary: string;
    secondary: string;
  };
  contentStyle: {
    form: string;        // e.g., "Long-form deep dives", "Short-form bursts"
    tone: string;        // e.g., "Direct Teaching", "Storytelling", "Experimental"
    vibe: string;        // e.g., "Serious Analyst", "Fun Entertainer"
  };
  archetype: string;     // e.g., "The Educator", "The Vlogger", "The Reviewer"
  topics: string[];      // List of specific topics (e.g., "Coding", "Gadgets")
  audience: {
    type: string;        // e.g., "College Students", "Tech Professionals"
    level: string;       // e.g., "Beginner", "Advanced"
  };
  consistency: {
    pattern: string;     // e.g., "Weekly on Fridays"
    frequency: string;   // e.g., "High Volume" or "Sporadic"
  };
  engagement: {
    behavior: string;    // e.g., "Highly interactive community", "Passive viewers"
    rate: string;        // e.g., "High", "Moderate", "Low"
  };
  swot: {
    strengths: string[];
    weaknesses: string[];
  };
  summary: string;       // A 2-sentence summary of "What + How + Who"
}

// 2. The AI Service Logic
export async function generatePersona(
  youtubeData: YouTubeChannelData | null, 
  instagramData: InstagramProfile | null
): Promise<CreatorPersona> {
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY is missing');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // 3. Construct the Prompt
  // We feed the raw JSON data to the AI and ask for a JSON response.
  const prompt = `
    Act as a professional Brand Strategist. Analyze the following creator data from YouTube and Instagram to build a comprehensive "Creator Persona".
    
    Data Source 1 (YouTube): ${JSON.stringify(youtubeData || 'Not Available')}
    Data Source 2 (Instagram): ${JSON.stringify(instagramData || 'Not Available')}

    Your Goal: Reverse-engineer the creator's strategy.
    
    Strictly output ONLY a JSON object with this exact schema (no markdown formatting):
    {
      "niche": { "primary": "...", "secondary": "..." },
      "contentStyle": { 
        "form": "Long-form/Short-form/Mixed", 
        "tone": "Teaching/Storytelling/etc", 
        "vibe": "Serious/Fun/Safe/Experimental" 
      },
      "archetype": "Educator/Entertainer/Analyst/Vlogger/etc",
      "topics": ["topic1", "topic2", ...],
      "audience": { "type": "Student/Pro/etc", "level": "Beginner/Expert" },
      "consistency": { "pattern": "e.g. Daily uploads", "frequency": "High/Low" },
      "engagement": { "behavior": "Fanatic/Passive/Critical", "rate": "High/Low" },
      "swot": { 
        "strengths": ["list 3 key strengths based on metrics"], 
        "weaknesses": ["list 3 potential weaknesses"] 
      },
      "summary": "A concise sentence covering what they make, how they make it, and who it is for."
    }

    Analysis Rules:
    - Infer 'Audience' from the complexity of video titles/captions.
    - Infer 'Consistency' by looking at the dates of recent posts.
    - Infer 'Primary Niche' from the most frequent keywords.
    - If data is missing for one platform, infer from the other.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the output (sometimes AI wraps JSON in markdown blocks)
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanedText) as CreatorPersona;
  } catch (error) {
    console.error('AI Persona Generation Failed:', error);
    // Fallback if AI fails (prevents app crash)
    return {
      niche: { primary: "Unknown", secondary: "Unknown" },
      contentStyle: { form: "Unknown", tone: "Unknown", vibe: "Unknown" },
      archetype: "Unknown",
      topics: [],
      audience: { type: "General", level: "All" },
      consistency: { pattern: "Unknown", frequency: "Unknown" },
      engagement: { behavior: "Unknown", rate: "Unknown" },
      swot: { strengths: [], weaknesses: [] },
      summary: "Could not generate persona."
    };
  }
}