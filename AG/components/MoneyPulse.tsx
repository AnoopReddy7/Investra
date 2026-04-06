
import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Article } from '../types';
import { apiService } from '../services/apiService';

const FALLBACK_NEWS_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%231e293b'/%3E%3Crect width='400' height='200' fill='%230f172a' opacity='0.5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='18' fill='%2394a3b8' font-weight='bold'%3EFinancial News%3C/text%3E%3C/svg%3E";

const MoneyPulse = () => {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const fetchNews = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const articles = await apiService.getNews();
    setNews(articles);
    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    fetchNews(true); // Initial fetch with loading spinner
    const intervalId = setInterval(() => fetchNews(false), 60000); // Poll purely in background every 60 seconds
    return () => clearInterval(intervalId);
  }, []);

  const getFilteredNews = () => {
    if (filter === 'All') return news;
    return news.filter(article => {
      const category = article.category?.toLowerCase();
      const filterLower = filter?.toLowerCase();
      return category === filterLower || 
             (filterLower === 'markets' && category === 'markets') ||
             (filterLower === 'corporate' && category === 'corporate') ||
             (filterLower === 'stocks' && category === 'stocks') ||
             (filterLower === 'cryptocurrency' && category === 'cryptocurrency') ||
             (filterLower === 'policy' && category === 'policy');
    });
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours > 24) return Math.floor(hours / 24) + ' days ago';
    return hours + ' hours ago';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Money Pulse</h2>
          <p className="text-slate-400">Stay updated with the latest financial news and market insights</p>
        </div>
        <button 
          onClick={() => fetchNews(true)} 
          disabled={loading}
          className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['All'].map((f) => (
           <button 
             key={f}
             onClick={() => setFilter(f)}
             className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
               filter === f 
                 ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                 : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
             }`}
           >
             {f}
           </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={40} className="text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredNews().map((article, index) => (
            <div key={index} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-600 transition-all flex flex-col group shadow-lg hover:shadow-xl hover:shadow-primary/5">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={article.imageUrl || FALLBACK_NEWS_IMAGE}
                  alt={article.title} 
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = FALLBACK_NEWS_IMAGE;
                  }}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-white uppercase tracking-wider">
                  {article.category || 'News'}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                 <div className="flex items-center text-xs text-slate-500 mb-3 space-x-2">
                   <span>{getTimeAgo(article.publishedAt)}</span>
                   <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                   <span className="text-primary font-medium">{article.source}</span>
                 </div>
                 <h3 className="text-lg font-bold text-slate-100 mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                   {article.title}
                 </h3>
                 <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-1">
                   {article.description}
                 </p>
                 <a 
                   href={article.url} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="inline-flex items-center text-primary text-sm font-medium hover:underline mt-auto"
                 >
                   Read full article <ExternalLink size={14} className="ml-1" />
                 </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MoneyPulse;
