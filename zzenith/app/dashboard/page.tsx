'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const yt = searchParams.get('yt');
      const ig = searchParams.get('ig');

      if (!yt && !ig) {
        setError('No profile links provided.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ youtubeUrl: yt, instagramUrl: ig }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to analyze profiles.');
        }

        setData(result.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-medium animate-pulse">Analyzing Creator DNA...</h2>
        <p className="text-gray-500 text-sm mt-2">Connecting dots between YouTube & Instagram</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <h2 className="text-2xl text-red-500 font-bold">Analysis Failed</h2>
          <p className="text-gray-400">{error}</p>
          <Link href="/" className="inline-block px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  const { persona } = data || {};

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-10 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Creator Dashboard
        </h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-white transition">
          New Analysis
        </Link>
      </header>

      {/* RAW DATA SECTION (YouTube & Instagram Cards) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        
        {/* YOUTUBE CARD */}
        {data?.youtube && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center space-x-4 mb-6">
              <img 
                src={data.youtube.thumbnail} 
                alt="YT" 
                className="w-16 h-16 rounded-full border-2 border-red-500"
              />
              <div>
                <h2 className="text-xl font-bold">{data.youtube.title}</h2>
                <div className="text-gray-400 text-sm flex gap-3">
                  <span>
                    🔴 {data.youtube.statistics?.subscriberCount 
                          ? parseInt(data.youtube.statistics.subscriberCount).toLocaleString() 
                          : 'Hidden'} Subs
                  </span>
                  <span>
                    👀 {data.youtube.statistics?.viewCount 
                          ? parseInt(data.youtube.statistics.viewCount).toLocaleString() 
                          : '0'} Views
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent Performance</h3>
            <div className="space-y-4">
              {data.youtube.recentVideos && data.youtube.recentVideos.length > 0 ? (
                data.youtube.recentVideos.slice(0, 3).map((video: any) => (
                  <div key={video.id} className="flex gap-4 p-3 bg-black/20 rounded-lg hover:bg-black/40 transition">
                    <div className="relative min-w-[6rem] w-24 h-16">
                      <img src={video.thumbnail} className="w-full h-full object-cover rounded" alt="thumb" />
                      {video.duration && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-mono">
                          {video.duration.replace('PT', '').replace('H', ':').replace('M', ':').replace('S', '')}
                        </span>
                      )}
                    </div>
                    <div className="overflow-hidden flex-1 flex flex-col justify-center">
                      <p className="text-sm font-medium truncate text-gray-200" title={video.title}>{video.title}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                         <span className="flex items-center gap-1">👀 {parseInt(video.viewCount || '0').toLocaleString()}</span>
                         <span className="flex items-center gap-1">👍 {parseInt(video.likeCount || '0').toLocaleString()}</span>
                         <span className="ml-auto text-gray-500">{new Date(video.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent videos found.</p>
              )}
            </div>
          </div>
        )}

        {/* INSTAGRAM CARD */}
        {data?.instagram && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center space-x-4 mb-6">
              
              {/* Profile Pic with Referrer Fix */}
              {data.instagram.profilePicUrl ? (
                <img 
                  src={data.instagram.profilePicUrl} 
                  alt="IG" 
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full border-2 border-pink-500 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}

              {/* Fallback Initials */}
              <div className={`${data.instagram.profilePicUrl ? 'hidden' : 'flex'} w-16 h-16 rounded-full border-2 border-pink-500 bg-gradient-to-br from-pink-500 to-orange-400 items-center justify-center text-xl font-bold`}>
                  {data.instagram.username?.[0]?.toUpperCase() || 'IG'}
              </div>

              <div>
                <h2 className="text-xl font-bold">{data.instagram.fullName || data.instagram.username}</h2>
                <p className="text-gray-500 text-sm">@{data.instagram.username}</p>
                <div className="text-gray-400 text-sm flex gap-3 mt-1">
                  <span>👥 {data.instagram.followers?.toLocaleString() || 0} Followers</span>
                  <span>📸 {data.instagram.postsCount || 0} Posts</span>
                </div>
              </div>
            </div>
            
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent Posts</h3>
            
            {data.instagram.recentPosts && data.instagram.recentPosts.length > 0 ? (
               <div className="grid grid-cols-3 gap-2">
                 {data.instagram.recentPosts.slice(0, 6).map((post: any) => (
                   <a key={post.id} href={post.url} target="_blank" rel="noreferrer" className="block aspect-square relative group overflow-hidden rounded-md bg-gray-800">
                     
                     {/* Post Thumbnail with Referrer Fix */}
                     {post.thumbnail ? (
                       <img 
                         src={post.thumbnail} 
                         alt="post" 
                         referrerPolicy="no-referrer"
                         className="w-full h-full object-cover" 
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-600">📷</div>
                     )}

                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <span className="text-xs font-bold text-white">❤️ {post.likes}</span>
                     </div>
                   </a>
                 ))}
               </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Recent posts could not be scraped.
              </p>
            )}
          </div>
        )}
      </div>

      {/* --- AI PERSONA REPORT SECTION --- */}
      {persona && (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <h2 className="text-2xl font-bold text-white">Zzenith Identity Report</h2>
          </div>

          {/* 1. Summary Banner */}
          <div className="p-6 bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-indigo-500/30 rounded-2xl">
            <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-2">Executive Summary</h3>
            <p className="text-lg text-gray-200 italic">"{persona.summary}"</p>
          </div>

          {/* 2. Strategy Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Archetype Card */}
            <div className="bg-[#111] border border-gray-800 p-6 rounded-2xl">
               <h3 className="text-gray-500 text-sm uppercase mb-4 font-bold">Creator Archetype</h3>
               <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                 {persona.archetype}
               </div>
               <div className="mt-4 flex flex-wrap gap-2">
                 {persona.topics?.map((topic: string, i: number) => (
                   <span key={i} className="px-3 py-1 bg-gray-800 text-xs rounded-full text-gray-300">#{topic}</span>
                 ))}
               </div>
            </div>

            {/* Niche Card */}
            <div className="bg-[#111] border border-gray-800 p-6 rounded-2xl">
               <h3 className="text-gray-500 text-sm uppercase mb-4 font-bold">Market Position</h3>
               <div className="space-y-4">
                 <div>
                   <span className="text-xs text-gray-500">Primary Niche</span>
                   <p className="text-xl font-semibold text-white">{persona.niche.primary}</p>
                 </div>
                 <div>
                   <span className="text-xs text-gray-500">Secondary Niche</span>
                   <p className="text-xl font-semibold text-gray-400">{persona.niche.secondary}</p>
                 </div>
               </div>
            </div>

            {/* Audience Card */}
            <div className="bg-[#111] border border-gray-800 p-6 rounded-2xl">
               <h3 className="text-gray-500 text-sm uppercase mb-4 font-bold">Target Audience</h3>
               <div className="space-y-4">
                 <div className="flex justify-between border-b border-gray-800 pb-2">
                   <span className="text-gray-400">Type</span>
                   <span className="font-medium">{persona.audience.type}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-800 pb-2">
                   <span className="text-gray-400">Level</span>
                   <span className="font-medium">{persona.audience.level}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-400">Engagement</span>
                   <span className="font-medium text-green-400">{persona.engagement.rate}</span>
                 </div>
               </div>
            </div>
          </div>

          {/* 3. DNA & SWOT Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Content DNA */}
            <div className="bg-[#111] border border-gray-800 p-6 rounded-2xl">
               <h3 className="text-gray-500 text-sm uppercase mb-4 font-bold">Content DNA</h3>
               <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gray-900 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Format</div>
                    <div className="font-medium text-sm">{persona.contentStyle.form}</div>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Tone</div>
                    <div className="font-medium text-sm">{persona.contentStyle.tone}</div>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Vibe</div>
                    <div className="font-medium text-sm">{persona.contentStyle.vibe}</div>
                  </div>
               </div>
            </div>

            {/* SWOT Analysis */}
            <div className="bg-[#111] border border-gray-800 p-6 rounded-2xl grid grid-cols-2 gap-6">
               <div>
                  <h3 className="text-green-500 text-sm uppercase mb-3 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {persona.swot.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300 leading-snug">• {s}</li>
                    ))}
                  </ul>
               </div>
               <div>
                  <h3 className="text-red-500 text-sm uppercase mb-3 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Weaknesses
                  </h3>
                  <ul className="space-y-2">
                    {persona.swot.weaknesses.map((w: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300 leading-snug">• {w}</li>
                    ))}
                  </ul>
               </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}