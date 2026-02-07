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
        <h2 className="text-xl font-medium animate-pulse">Building your Creator Persona...</h2>
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

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
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
                    
                    {/* Thumbnail with Duration Badge */}
                    <div className="relative min-w-[6rem] w-24 h-16">
                      <img src={video.thumbnail} className="w-full h-full object-cover rounded" alt="thumb" />
                      {video.duration && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-mono">
                          {video.duration.replace('PT', '').replace('H', ':').replace('M', ':').replace('S', '')}
                        </span>
                      )}
                    </div>

                    {/* Video Details */}
                    <div className="overflow-hidden flex-1 flex flex-col justify-center">
                      <p className="text-sm font-medium truncate text-gray-200" title={video.title}>{video.title}</p>
                      
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                         {/* View Count */}
                         <span className="flex items-center gap-1">
                           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                           {parseInt(video.viewCount || '0').toLocaleString()}
                         </span>

                         {/* Like Count */}
                         <span className="flex items-center gap-1">
                           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                           {parseInt(video.likeCount || '0').toLocaleString()}
                         </span>

                         {/* Date */}
                         <span className="ml-auto text-gray-500">
                            {new Date(video.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                         </span>
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
              
              {/* Profile Pic with Fallback */}
              {data.instagram.profilePicUrl ? (
                <img 
                  src={data.instagram.profilePicUrl} 
                  alt="IG" 
                  className="w-16 h-16 rounded-full border-2 border-pink-500 object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-pink-500 bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-xl font-bold">
                  {data.instagram.username?.[0]?.toUpperCase() || 'IG'}
                </div>
              )}

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
                     
                     {/* Post Thumbnail with Fallback */}
                     {post.thumbnail ? (
                       <img src={post.thumbnail} className="w-full h-full object-cover" alt="post" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-600">
                         📷
                       </div>
                     )}

                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <span className="text-xs font-bold text-white">❤️ {post.likes}</span>
                     </div>
                   </a>
                 ))}
               </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Recent posts could not be scraped (Profile might be private or API limited).
              </p>
            )}
          </div>
        )}

      </div>
      
      {/* AI INSIGHTS PLACEHOLDER */}
      <div className="mt-8 p-6 bg-gradient-to-r from-violet-900/20 to-indigo-900/20 border border-indigo-500/20 rounded-2xl">
        <h3 className="text-lg font-bold text-indigo-300 mb-2">✨ Zzenith AI Analysis</h3>
        <p className="text-gray-400">
          Coming Soon: Our AI will read this data to generate your unique creator persona and strategy.
        </p>
      </div>
    </div>
  );
}