import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Newspaper, ExternalLink, RefreshCw, Tag, Clock } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  summary: string;
  link: string;
  pubDate: string;
  image: string | null;
  category: string;
  source: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'כושר':   'bg-primary/20 text-primary',
  'תזונה':  'bg-accent/20 text-accent',
  'כוח':    'bg-orange-500/20 text-orange-400',
  'שרירים': 'bg-secondary/20 text-secondary',
  'בריאות': 'bg-green-500/20 text-green-400',
};

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `לפני ${d} ימים`;
  if (h > 0) return `לפני ${h} שעות`;
  return 'לאחרונה';
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
  'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
];

export default function News() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [filter, setFilter] = useState('הכל');
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/news');
      setArticles(res.data);
    } catch {
      setError('לא ניתן לטעון חדשות כרגע. נסה שוב.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const categories = ['הכל', ...Array.from(new Set(articles.map(a => a.category)))];
  const filtered = filter === 'הכל' ? articles : articles.filter(a => a.category === filter);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-primary" />
            חדשות כושר ותזונה
          </h1>
          <p className="text-gray-400 mt-1">עדכונים חמים מעולם הכושר והתזונה</p>
        </div>
        <button
          onClick={() => fetchNews(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-gray-400 hover:text-white hover:border-primary transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          רענן
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === cat
                ? 'gradient-bg text-white shadow-lg shadow-primary/20'
                : 'bg-surface border border-border text-gray-400 hover:text-white hover:border-primary/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="skeleton h-44 rounded-xl mb-4" />
              <div className="skeleton h-4 rounded mb-2 w-3/4" />
              <div className="skeleton h-3 rounded mb-1" />
              <div className="skeleton h-3 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={() => fetchNews()} className="btn-primary">נסה שוב</button>
        </div>
      )}

      {/* Articles grid */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>אין מאמרים בקטגוריה זו</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((article, idx) => (
                <a
                  key={article.id || idx}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card group hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col overflow-hidden p-0"
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden rounded-t-2xl">
                    <img
                      src={article.image || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[article.category] || 'bg-surface text-gray-400'}`}>
                      {article.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-primary font-medium">{article.source}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {timeAgo(article.pubDate)}
                      </span>
                    </div>

                    <h3 className="text-white font-bold text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>

                    {article.summary && (
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 flex-1">
                        {article.summary}
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-primary text-sm font-medium mt-4 group-hover:gap-2 transition-all">
                      <span>קרא עוד</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <p className="text-center text-gray-600 text-sm pb-4">
              מציג {filtered.length} מאמרים · מתעדכן כל 10 דקות
            </p>
          )}
        </>
      )}
    </div>
  );
}
