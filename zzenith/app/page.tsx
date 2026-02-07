'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError('');
    
  //   // Validation: At least one field is required
  //   if (!youtubeUrl.trim() && !instagramUrl.trim()) {
  //     setError('Please provide at least one platform link to continue.');
  //     return;
  //   }

  //   setIsLoading(true);

  //   try {
  //     // TODO: Call API
  //     // const response = await fetch('/api/analyze', { ... });
      
  //     // Simulation
  //     await new Promise(resolve => setTimeout(resolve, 2000));
  //     router.push('/dashboard'); 
      
  //   } catch (err) {
  //     setError('Something went wrong. Please try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!youtubeUrl.trim() && !instagramUrl.trim()) {
      setError('Please provide at least one platform link to continue.');
      return;
    }

    setIsLoading(true);

    // Construct Query Params
    const params = new URLSearchParams();
    if (youtubeUrl) params.set('yt', youtubeUrl);
    if (instagramUrl) params.set('ig', instagramUrl);

    // Redirect to Dashboard
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-[#0a0a0a] text-white overflow-hidden">
      
      {/* Background Gradient Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-lg space-y-8 z-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Zzenith
          </h1>
          <p className="text-lg text-gray-400">
            For the Creators at the Top!
          </p>
        </div>

        {/* Glassmorphism Form */}
        <form 
          onSubmit={handleSubmit} 
          className="mt-8 space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl"
        >
          <div className="space-y-5">
            
            {/* YouTube Input */}
            <div className="space-y-1">
              <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-300 ml-1">
                YouTube Channel URL
              </label>
              <div className="relative group">
                <input
                  id="youtube-url"
                  name="youtube"
                  type="url"
                  placeholder="https://youtube.com/@channel"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="block w-full rounded-xl bg-black/40 border border-white/10 text-white px-4 py-3 
                  placeholder:text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 
                  focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Instagram Input */}
            <div className="space-y-1">
              <label htmlFor="instagram-url" className="block text-sm font-medium text-gray-300 ml-1">
                Instagram Profile URL
              </label>
              <div className="relative group">
                <input
                  id="instagram-url"
                  name="instagram"
                  type="url"
                  placeholder="https://instagram.com/username"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="block w-full rounded-xl bg-black/40 border border-white/10 text-white px-4 py-3 
                  placeholder:text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 
                  focus:outline-none transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Validation Error */}
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* CTA Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-3.5 px-4 rounded-xl text-base font-bold text-white shadow-lg transition-all duration-300
              ${isLoading 
                ? 'bg-gray-700 cursor-not-allowed opacity-70' 
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-indigo-500/25 hover:scale-[1.02]'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Start Analyzing'
            )}
          </button>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            Enter at least one profile to begin your analysis.
          </p>
        </form>
      </div>
    </main>
  );
}