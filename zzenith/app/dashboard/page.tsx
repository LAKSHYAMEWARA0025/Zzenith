'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TrendChart from '@/components/TrendChart';

const formatNumber = (num: number | string | undefined) => {
  if (!num) return '0';
  const n = Number(num);
  if (isNaN(n)) return '0'; // Handle bad numbers
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
};

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<'youtube' | 'instagram'>('youtube');
  const [filterType, setFilterType] = useState<'views' | 'recent' | 'comments'>('views');

  useEffect(() => {
    const fetchData = async () => {
      const yt = searchParams.get('yt');
      const ig = searchParams.get('ig');
      if (!yt && !ig) { setError('No profile links provided.'); setLoading(false); return; }
      
      try {
        // Pass forceRefresh=true if you want to bypass the DB cache while testing
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ youtubeUrl: yt, instagramUrl: ig }),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error);
        
        setData(result.data);
        if (!result.data.youtube && result.data.instagram) setActiveTab('instagram');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchParams]);

  // --- DEBUG LOGGING ---
  if (data) {
    console.log("------------------------------------------------");
    console.log("🖥️ [FRONTEND DEBUG] Full Data Object:", data);
    console.log("🖥️ [FRONTEND DEBUG] YouTube Object:", data.youtube);
    console.log("🖥️ [FRONTEND DEBUG] YouTube Recent Videos:", data.youtube?.recentVideos);
    console.log("🖥️ [FRONTEND DEBUG] Is Videos Array?", Array.isArray(data.youtube?.recentVideos));
    console.log("------------------------------------------------");
  }
  // ---------------------

  // --- CALCULATIONS ---
  const { youtube, instagram, persona } = data || {};

  // SAFEGUARD: Ensure lists are arrays
  const ytVideos = Array.isArray(youtube?.recentVideos) ? youtube.recentVideos : [];
  const igPosts = Array.isArray(instagram?.recentPosts) ? instagram.recentPosts : [];

  const monthlyViews = useMemo(() => {
    let total = 0;
    if (ytVideos.length > 0) {
      // Handle snake_case from DB or camelCase from API
      total += ytVideos.reduce((acc: number, vid: any) => acc + Number(vid.viewCount || vid.view_count || 0), 0);
    }
    if (igPosts.length > 0) {
      total += igPosts.reduce((acc: number, post: any) => acc + (Number(post.likes || 0) * 10), 0);
    }
    return total;
  }, [ytVideos, igPosts]);

  const engagementRate = useMemo(() => {
    if (persona?.engagement?.rate) return persona.engagement.rate;
    if (instagram) return instagram.engagementRate + '%';
    return 'N/A';
  }, [persona, instagram]);

  const getFilteredContent = () => {
    const source = activeTab === 'youtube' ? ytVideos : igPosts;
    if (!source) return [];

    let sorted = [...source];
    if (filterType === 'views') {
      sorted.sort((a, b) => {
        const valA = Number(a.viewCount || a.view_count || a.likes || 0);
        const valB = Number(b.viewCount || b.view_count || b.likes || 0);
        return valB - valA;
      });
    } else if (filterType === 'comments') {
      sorted.sort((a, b) => {
        const valA = Number(a.commentCount || a.comment_count || a.comments || 0);
        const valB = Number(b.commentCount || b.comment_count || b.comments || 0);
        return valB - valA;
      });
    }
    return sorted.slice(0, 3);
  };

  const mostEngagingItem = useMemo(() => {
    const source = activeTab === 'youtube' ? ytVideos : igPosts;
    if (!source || source.length === 0) return null;
    return [...source].sort((a, b) => {
      const engA = Number(a.likeCount || a.like_count || a.likes || 0) + Number(a.commentCount || a.comment_count || a.comments || 0);
      const engB = Number(b.likeCount || b.like_count || b.likes || 0) + Number(b.commentCount || b.comment_count || b.comments || 0);
      return engB - engA;
    })[0];
  }, [activeTab, ytVideos, igPosts]);


  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
      
      {/* HEADER */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Creator DNA
          </h1>
          <p className="text-gray-400 mt-1">Strategic Dashboard</p>
        </div>
        <Link href="/" className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition">
          New Analysis
        </Link>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">

        {/* 1. EXECUTIVE SUMMARY */}
        {persona && (
          <section className="bg-gradient-to-r from-violet-900/30 to-indigo-900/30 border border-indigo-500/30 p-6 md:p-8 rounded-3xl backdrop-blur-md">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <h2 className="text-indigo-300 text-sm font-bold uppercase tracking-wider mb-3">Executive Summary</h2>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-100">
                  "{persona.summary}"
                </p>
              </div>
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 min-w-[200px] text-center">
                <div className="text-gray-500 text-xs uppercase font-bold mb-1">Archetype</div>
                <div className="text-2xl font-bold text-violet-300">{persona.archetype}</div>
                <div className="text-xs text-gray-400 mt-1">{persona.niche.primary}</div>
              </div>
            </div>
          </section>
        )}

        {/* 2. VITALS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Est. Monthly Views" value={formatNumber(monthlyViews)} icon="👁️" subtext="Based on recent performance" />
          <StatCard label="Engagement Rate" value={engagementRate} icon="⚡" subtext={persona?.engagement.behavior || 'Calculated score'} highlight />
          <StatCard label="Total Audience" value={formatNumber((Number(youtube?.statistics?.subscriberCount || 0) + Number(instagram?.followers || 0)))} icon="👥" subtext="Cross-platform reach" />
          
          {/* --- MONETIZATION CARD --- */}
          <div className="relative group bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between overflow-hidden hover:border-green-500/30 transition-all cursor-default">
             <div className="flex flex-col h-full justify-between transition duration-300 group-hover:blur-sm group-hover:opacity-30">
                <div className="flex justify-between items-start">
                   <span className="text-gray-400 text-sm font-medium">Monetization</span>
                   <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                   </div>
                </div>
                <div>
                   <div className="text-3xl font-bold text-gray-500 blur-[5px] select-none">$12,450</div>
                   <div className="text-xs text-gray-600 mt-1 blur-[2px]">Est. Monthly Revenue</div>
                </div>
             </div>
             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 transform scale-95 group-hover:scale-100">
                <span className="text-3xl mb-2">💸</span>
                <span className="text-green-400 font-bold text-sm uppercase tracking-wide">Monetization</span>
                <span className="text-white text-xs mt-1">Coming Soon</span>
             </div>
          </div>
        </section>

        {/* 3. SWOT ANALYSIS */}
        {persona && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#111] border border-green-900/30 p-6 rounded-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
               <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2">✅ Strengths</h3>
               <ul className="space-y-3">
                 {persona.swot.strengths.map((s: string, i: number) => (
                   <li key={i} className="flex gap-3 text-gray-300 text-sm"><span className="text-green-500 mt-1">●</span> {s}</li>
                 ))}
               </ul>
            </div>
            <div className="bg-[#111] border border-red-900/30 p-6 rounded-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
               <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">⚠️ Weaknesses</h3>
               <ul className="space-y-3">
                 {persona.swot.weaknesses.map((w: string, i: number) => (
                   <li key={i} className="flex gap-3 text-gray-300 text-sm"><span className="text-red-500 mt-1">●</span> {w}</li>
                 ))}
               </ul>
            </div>
          </section>
        )}

        {/* 4. CONTENT ENGINE */}
        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
          
          {/* Tabs */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-2 bg-black/40 p-1 rounded-xl">
              {youtube && (
                <button 
                  onClick={() => setActiveTab('youtube')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'youtube' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  YouTube
                </button>
              )}
              {instagram && (
                <button 
                  onClick={() => setActiveTab('instagram')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'instagram' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  Instagram
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {['views', 'recent', 'comments'].map((f) => (
                <button key={f} onClick={() => setFilterType(f as any)} className={`px-3 py-1 rounded-full text-xs border transition ${filterType === f ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}>
                  Most {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* HERO CARD */}
            <div className="lg:col-span-1">
              <h4 className="text-gray-400 text-xs font-bold uppercase mb-4">👑 Most Engaging {activeTab === 'youtube' ? 'Video' : 'Post'}</h4>
              {mostEngagingItem ? (
                 activeTab === 'youtube' ? (
                   <div className="group relative aspect-[9/16] md:aspect-square w-full rounded-2xl overflow-hidden border border-white/10">
                     <img src={mostEngagingItem.thumbnail || mostEngagingItem.displayUrl} alt="Hero" className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-6">
                        <h3 className="text-white font-bold line-clamp-2 mb-2">{mostEngagingItem.title}</h3>
                        <div className="flex gap-4 text-sm font-medium">
                          <span>❤️ {formatNumber(mostEngagingItem.likeCount || mostEngagingItem.like_count)}</span>
                          <span>💬 {formatNumber(mostEngagingItem.commentCount || mostEngagingItem.comment_count)}</span>
                        </div>
                     </div>
                   </div>
                 ) : (
                   <a href={mostEngagingItem.url} target="_blank" rel="noreferrer" className="block aspect-[9/16] md:aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/10 p-6 flex flex-col justify-between group hover:border-pink-500/50 transition">
                      <div className="flex justify-between items-start">
                         <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                         </div>
                         <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-gray-300 group-hover:bg-pink-500 group-hover:text-white transition">View Post ↗</div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-gray-300 text-lg leading-snug line-clamp-4 font-light italic">"{mostEngagingItem.caption || 'Post'}"</p>
                        <div className="flex gap-6 border-t border-white/10 pt-4">
                          <div>
                             <div className="text-xs text-gray-500 uppercase font-bold">Likes</div>
                             <div className="text-2xl font-bold text-white">{formatNumber(mostEngagingItem.likes)}</div>
                          </div>
                          <div>
                             <div className="text-xs text-gray-500 uppercase font-bold">Comments</div>
                             <div className="text-2xl font-bold text-white">{formatNumber(mostEngagingItem.comments)}</div>
                          </div>
                        </div>
                      </div>
                   </a>
                 )
              ) : (
                <div className="h-64 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500">No Data</div>
              )}
            </div>

            {/* TOP 3 LIST */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              <div>
                <h4 className="text-gray-400 text-xs font-bold uppercase mb-4">🔥 Top 3 Content ({filterType})</h4>
                <div className="space-y-3">
                  {getFilteredContent().map((item: any, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-black/20 rounded-xl hover:bg-black/40 transition border border-white/5">
                      <div className="w-20 h-14 md:w-32 md:h-20 flex-shrink-0 rounded-lg overflow-hidden relative bg-gray-800 flex items-center justify-center">
                         {activeTab === 'youtube' ? (
                           <img src={item.thumbnail} className="w-full h-full object-cover" alt="" />
                         ) : (
                           <span className="text-2xl">📸</span>
                         )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-gray-200 truncate">{item.title || item.caption || 'Post'}</h5>
                        <div className="flex gap-3 mt-1 text-xs text-gray-400">
                           {activeTab === 'youtube' ? (
                             <><span>👀 {formatNumber(item.viewCount || item.view_count)}</span><span>❤️ {formatNumber(item.likeCount || item.like_count)}</span></>
                           ) : (
                             <><span>❤️ {formatNumber(item.likes)}</span><span>💬 {formatNumber(item.comments)}</span></>
                           )}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-700">#{i+1}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DYNAMIC PERFORMANCE TREND CHART */}
              {(ytVideos.length > 0 || igPosts.length > 0) ? (
                <div className="mt-8 pt-8 border-t border-white/5">
                   <div className="flex items-center justify-between mb-2">
                     <h4 className="text-gray-400 text-xs font-bold uppercase">
                       📈 Performance Trend (Last 5 {activeTab === 'youtube' ? 'Uploads' : 'Posts'})
                     </h4>
                     <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`w-2 h-2 rounded-full ${activeTab === 'youtube' ? 'bg-red-500' : 'bg-pink-500'}`}></span>
                        {activeTab === 'youtube' ? 'Views' : 'Likes'}
                     </div>
                   </div>
                   
                   <TrendChart 
                     data={activeTab === 'youtube' ? ytVideos : igPosts} 
                     platform={activeTab} 
                   />
                </div>
              ) : null}

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// Subcomponents
const StatCard = ({ label, value, icon, subtext, highlight = false }: any) => (
  <div className={`p-5 rounded-2xl border flex flex-col justify-between ${highlight ? 'bg-gradient-to-br from-indigo-900/40 to-violet-900/10 border-indigo-500/50' : 'bg-white/5 border-white/10'}`}>
     <div className="flex justify-between items-start mb-4">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        <span className="text-xl">{icon}</span>
     </div>
     <div>
        <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        <div className="text-xs text-gray-500 mt-1">{subtext}</div>
     </div>
  </div>
);

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
    <h2 className="text-xl font-medium animate-pulse">Building Command Center...</h2>
  </div>
);

const ErrorScreen = ({ error }: { error: string }) => (
  <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
    <div className="text-center space-y-4">
      <h2 className="text-2xl text-red-500 font-bold">Analysis Failed</h2>
      <p className="text-gray-400">{error}</p>
      <Link href="/" className="inline-block px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">Try Again</Link>
    </div>
  </div>
);