import React, { useState } from 'react';
import { Play, BookOpen, Search, X } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  category: string;
  duration: string;
  level: string;
}

const VIDEOS: VideoItem[] = [
  // טכניקת תרגילים
  { id: '1',  title: 'סקוואט — המדריך השלם לטכניקה נכונה',      description: 'המדריך המלא לביצוע סקוואט נכון, כולל שגיאות נפוצות ותיקונים',         youtubeId: 'ultWZbUMPL8', category: 'טכניקה',      duration: '12:34', level: 'מתחיל' },
  { id: '2',  title: 'דדליפט — ביצוע בטוח מ-0 למתקדם',          description: 'הסבר שלב אחר שלב כיצד לבצע דדליפט בצורה בטוחה ויעילה',              youtubeId: 'r4MzxtBKyNE', category: 'טכניקה',      duration: '14:22', level: 'מתחיל' },
  { id: '3',  title: 'לחיצת חזה — כל מה שצריך לדעת',            description: 'תנוחה, אחיזה, טווח תנועה וסדרות — המדריך הסופי ללחיצת חזה',          youtubeId: 'BYKScL2sgCs', category: 'טכניקה',      duration: '9:47',  level: 'מתחיל' },
  { id: '4',  title: 'מתח (Pull-Up) — מ-0 חזרות ל-20',          description: 'תוכנית התקדמות מלאה למתחילים עד מתקדמים',                             youtubeId: 'XB_7En-zf_M', category: 'טכניקה',      duration: '11:15', level: 'מתחיל' },
  { id: '5',  title: 'כפיפות בטן — שריפת שרירי הליבה',          description: 'הדרך הנכונה לאמן בטן שבאמת עובדת על שרירי הליבה',                    youtubeId: 'DHD1-2P4sWs', category: 'טכניקה',      duration: '7:30',  level: 'מתחיל' },
  { id: '6',  title: 'כפיפות ידיים (Bicep Curl) — טכניקה',      description: 'איך לאמן ביצפס בצורה נכונה לתוצאות מקסימליות',                        youtubeId: 'ykJmrZ5v0Oo', category: 'טכניקה',      duration: '13:00', level: 'מתקדם' },
  // תזונה
  { id: '7',  title: 'כמה חלבון צריך לאכול ביום?',               description: 'המדע מאחורי צריכת חלבון לבניית שריר וחיטוב',                          youtubeId: 'lSDVJxzOBBo', category: 'תזונה',        duration: '10:05', level: 'כולם'  },
  { id: '8',  title: 'הכנת ארוחות שבועית (Meal Prep)',           description: 'איך להכין 5 ארוחות בריאות ב-60 דקות בלבד',                           youtubeId: 'UFCNqvNAkxk', category: 'תזונה',        duration: '18:44', level: 'כולם'  },
  { id: '9',  title: 'קלוריות ומאקרו — המדריך הפשוט',           description: 'כיצד לספור קלוריות ולהבין מאקרונוטריינטים בצורה פשוטה',             youtubeId: 'CO3FiOqFCnI', category: 'תזונה',        duration: '15:20', level: 'מתחיל' },
  { id: '10', title: 'מה לאכול לפני ואחרי אימון?',               description: 'תזמון נכון של אכילה לפני ואחרי אימון למקסום תוצאות',                 youtubeId: 'uxFpGkgnZwk', category: 'תזונה',        duration: '8:55',  level: 'כולם'  },
  { id: '11', title: 'אכילה לחיטוב — כל הסודות',                description: 'תוכנית תזונה מדויקת לחיטוב ושמירה על מסת שריר',                      youtubeId: 'Wfbxj8NdX2Y', category: 'תזונה',        duration: '9:10',  level: 'כולם'  },
  // קרדיו
  { id: '12', title: 'אימון HIIT 20 דקות — שריפת שומן מלאה',    description: 'אימון אינטרוולים עצים שמעלה את חילוף החומרים ל-48 שעות',            youtubeId: 'ml6cT4AZdqI', category: 'קרדיו',        duration: '20:00', level: 'בינוני' },
  { id: '13', title: 'ריצה נכונה — טכניקה שתמנע פציעות',        description: 'יציבה, צעד, נשימה — כל מה שצריך לדעת על ריצה נכונה',               youtubeId: 'brFHyOtTwH4', category: 'קרדיו',        duration: '11:30', level: 'מתחיל' },
  // גוף מלא
  { id: '14', title: 'אימון גוף מלא ללא ציוד — 30 דקות',        description: 'אימון עם משקל גוף בלבד שאפשר לעשות בבית או בפארק',                 youtubeId: 'UItWltVZZmE', category: 'גוף מלא',      duration: '30:00', level: 'כולם'  },
  // התאוששות
  { id: '15', title: 'מתיחות לאחר אימון — 10 דקות קריטיות',     description: 'שגרת מתיחות שתפחית כאבי שרירים ותשפר גמישות לאחר כל אימון',       youtubeId: 'g_tea8ZNk5A', category: 'התאוששות',    duration: '10:00', level: 'כולם'  },
  { id: '16', title: 'שינה וכושר — הקשר המפתיע',                description: 'למה שינה היא הגורם החשוב ביותר לבניית שריר וחיטוב',                youtubeId: '5MuIMqhT8oU', category: 'התאוששות',    duration: '12:18', level: 'כולם'  },
];

const CATEGORIES = ['הכל', 'טכניקה', 'תזונה', 'קרדיו', 'גוף מלא', 'התאוששות'];
const LEVELS     = ['הכל', 'מתחיל', 'בינוני', 'מתקדם', 'כולם'];

const LEVEL_COLORS: Record<string, string> = {
  'מתחיל':  'bg-green-500/20 text-green-400',
  'בינוני': 'bg-yellow-500/20 text-yellow-400',
  'מתקדם':  'bg-red-500/20 text-red-400',
  'כולם':   'bg-primary/20 text-primary',
};

export default function Learn() {
  const [category, setCategory] = useState('הכל');
  const [level, setLevel]       = useState('הכל');
  const [search, setSearch]     = useState('');
  const [playing, setPlaying]   = useState<VideoItem | null>(null);

  const filtered = VIDEOS.filter(v => {
    const matchCat   = category === 'הכל' || v.category === category;
    const matchLevel = level    === 'הכל' || v.level    === level;
    const matchSearch = !search || v.title.includes(search) || v.description.includes(search);
    return matchCat && matchLevel && matchSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          סרטוני הדרכה
        </h1>
        <p className="text-gray-400 mt-1">למד טכניקה נכונה, תזונה חכמה וכל מה שצריך להצליח</p>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חפש וידאו..."
            className="input-field pr-10"
          />
        </div>

        {/* Category pills */}
        <div>
          <p className="text-xs text-gray-500 mb-2">קטגוריה</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? 'gradient-bg text-white shadow-md shadow-primary/20'
                    : 'bg-surface border border-border text-gray-400 hover:text-white hover:border-primary/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Level pills */}
        <div>
          <p className="text-xs text-gray-500 mb-2">רמה</p>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  level === l
                    ? 'gradient-bg text-white shadow-md shadow-primary/20'
                    : 'bg-surface border border-border text-gray-400 hover:text-white hover:border-primary/50'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-gray-500 text-sm">{filtered.length} סרטונים</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>לא נמצאו סרטונים</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(video => (
            <div
              key={video.id}
              className="card group hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col p-0 overflow-hidden cursor-pointer"
              onClick={() => setPlaying(video)}
            >
              {/* Thumbnail */}
              <div className="relative">
                <img
                  src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                  alt={video.title}
                  className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center shadow-2xl shadow-primary/40">
                    <Play className="w-6 h-6 text-white fill-white mr-[-2px]" />
                  </div>
                </div>
                <span className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">
                  {video.duration}
                </span>
                <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[video.level]}`}>
                  {video.level}
                </span>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col flex-1">
                <span className="text-xs text-primary font-medium mb-1">{video.category}</span>
                <h3 className="text-white font-bold text-sm leading-snug mb-1 group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{video.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal */}
      {playing && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPlaying(null)}
        >
          <div
            className="bg-card rounded-2xl overflow-hidden w-full max-w-4xl shadow-2xl shadow-black/60"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="text-xs text-primary font-medium mb-0.5">{playing.category} · {playing.level}</p>
                <h2 className="text-white font-bold text-lg leading-tight">{playing.title}</h2>
              </div>
              <button
                onClick={() => setPlaying(null)}
                className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-gray-400 hover:text-white hover:border-primary transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* YouTube embed */}
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${playing.youtubeId}?autoplay=1&rel=0`}
                title={playing.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Description */}
            <div className="px-5 py-4">
              <p className="text-gray-400 text-sm">{playing.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
