const express = require('express');
const Parser = require('rss-parser');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZOOTA-App/1.0)' },
  customFields: { item: ['media:content', 'media:thumbnail', 'enclosure'] }
});

// ערוצי RSS בעברית
const RSS_FEEDS = [
  {
    url: 'https://rss.walla.co.il/feed/22',
    category: 'בריאות',
    source: 'וואלה בריאות'
  },
  {
    url: 'https://www.sport5.co.il/rss.xml',
    category: 'כושר',
    source: 'ספורט 5'
  },
  {
    url: 'https://www.ynet.co.il/Integration/StoryRss2.xml',
    category: 'בריאות',
    source: 'ynet'
  }
];

// מאמרי ברירת מחדל בעברית — מוצגים תמיד
const STATIC_ARTICLES = [
  {
    id: 'static-1',
    title: '5 טעויות נפוצות באימון כוח שמונעות ממך להתקדם',
    summary: 'רוב המתאמנים עושים לפחות אחת מהטעויות הבאות: מנוחה קצרה מדי בין הסטים, אי-תיעוד האימונים, חוסר עקביות, תכנית לא מובנית, והזנחת שרירי הליבה. תיקון אחת מהן כבר ישפר את תוצאותיך.',
    link: 'https://www.sport5.co.il',
    pubDate: new Date(Date.now() - 1 * 3600000).toISOString(),
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
    category: 'כושר',
    source: 'ZOOTA'
  },
  {
    id: 'static-2',
    title: 'כמה פעמים בשבוע כדאי להתאמן לתוצאות מיטביות?',
    summary: 'מחקרים מראים כי 3-4 אימונים בשבוע הם הנוסחה האידיאלית עבור רוב האנשים. מנוחה היא חלק בלתי נפרד מהצמיחה — השרירים גדלים בזמן המנוחה, לא בזמן האימון עצמו.',
    link: 'https://www.sport5.co.il',
    pubDate: new Date(Date.now() - 3 * 3600000).toISOString(),
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
    category: 'כושר',
    source: 'ZOOTA'
  },
  {
    id: 'static-3',
    title: 'תזונת חלבון — המדריך המלא לבניית שריר',
    summary: 'כמות החלבון האופטימלית לבניית שריר היא 1.6-2.2 גרם לכל ק"ג משקל גוף. מקורות מומלצים: עוף, דגים, ביצים, טונה, גבינת קוטג\' ויוגורט יווני. מרווח הארוחות גם הוא חשוב.',
    link: 'https://rss.walla.co.il/feed/22',
    pubDate: new Date(Date.now() - 5 * 3600000).toISOString(),
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80',
    category: 'תזונה',
    source: 'ZOOTA'
  },
  {
    id: 'static-4',
    title: 'ירידה במשקל: למה דיאטות קיצוניות לא עובדות לאורך זמן',
    summary: 'דיאטות הרזיה קיצוניות גורמות לירידה במסת שריר, האטה בחילוף החומרים ועלייה ב-yo-yo לאחר הדיאטה. גירעון קלורי מתון של 300-500 קלוריות ביום יחד עם אימוני כוח הוא הגישה המדעית המוכחת.',
    link: 'https://www.ynet.co.il',
    pubDate: new Date(Date.now() - 8 * 3600000).toISOString(),
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
    category: 'תזונה',
    source: 'ZOOTA'
  },
  {
    id: 'static-5',
    title: 'אימון HIIT — היתרונות המוכחים מדעית',
    summary: 'אימון אינטרוולים עצים (HIIT) שורף עד 30% יותר קלוריות מאשר אימון אירובי רגיל, משפר את הכושר הקרדיווסקולרי ומייצר אפקט "אפטרברן" שמשרף שומן עד 48 שעות אחרי האימון.',
    link: 'https://www.sport5.co.il',
    pubDate: new Date(Date.now() - 12 * 3600000).toISOString(),
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80',
    category: 'כושר',
    source: 'ZOOTA'
  },
  {
    id: 'static-6',
    title: 'שינה וכושר — למה 8 שעות שינה הן חלק מהתוכנית',
    summary: 'בזמן השינה הגוף מפריש הורמון גדילה שאחראי לבניית שרירים ולהתאוששות. חוסר שינה מוביל לעלייה בקורטיזול, פגיעה בביצועים ועלייה בתיאבון. 7-9 שעות שינה הן חלק מהתוכנית שלך.',
    link: 'https://rss.walla.co.il/feed/22',
    pubDate: new Date(Date.now() - 18 * 3600000).toISOString(),
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    category: 'בריאות',
    source: 'ZOOTA'
  },
  {
    id: 'static-7',
    title: 'סקוואט — המלך של תרגילי הכוח',
    summary: 'הסקוואט הוא התרגיל האפקטיבי ביותר לפיתוח הרגליים, הישבן ושרירי הליבה. הוא מפעיל יותר מ-200 שרירים בו-זמנית ומגביר שחרור טסטוסטרון והורמון גדילה. טכניקה נכונה חיונית למניעת פציעות.',
    link: 'https://www.sport5.co.il',
    pubDate: new Date(Date.now() - 24 * 3600000).toISOString(),
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
    category: 'כוח',
    source: 'ZOOTA'
  },
  {
    id: 'static-8',
    title: 'ויטמין D וספורט — המחסור שרוב הישראלים לא יודעים שיש להם',
    summary: 'למרות השמש הישראלית, מחקרים מראים כי 50% מהאוכלוסייה סובלת ממחסור בויטמין D. ויטמין D חיוני לחוזק השרירים, ספיגת סידן, ופעילות הורמונלית תקינה. בדיקת דם פשוטה תגלה את הרמה שלך.',
    link: 'https://www.ynet.co.il',
    pubDate: new Date(Date.now() - 30 * 3600000).toISOString(),
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
    category: 'בריאות',
    source: 'ZOOTA'
  },
];

// Simple in-memory cache (10 min TTL)
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

async function fetchFeed(feedConfig) {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    return (feed.items || []).slice(0, 6).map(item => ({
      id: item.guid || item.link || item.title,
      title: item.title || '',
      summary: item.contentSnippet || item.summary || item.content || '',
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || '',
      image:
        item['media:content']?.$.url ||
        item['media:thumbnail']?.$.url ||
        item.enclosure?.url ||
        null,
      category: feedConfig.category,
      source: feedConfig.source
    }));
  } catch {
    return [];
  }
}

// GET /api/news
router.get('/', authenticateToken, async (req, res) => {
  try {
    const now = Date.now();
    if (cache && now - cacheTime < CACHE_TTL) {
      return res.json(cache);
    }

    // Fetch live RSS feeds (best-effort)
    const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));
    let liveArticles = [];
    results.forEach(r => {
      if (r.status === 'fulfilled') liveArticles = liveArticles.concat(r.value);
    });

    // Filter: Hebrew titles only (contain Hebrew characters)
    const hebrewRegex = /[\u0590-\u05FF]/;
    liveArticles = liveArticles.filter(a => a.title && a.link && hebrewRegex.test(a.title));

    // Merge static + live, static first
    let articles = [...STATIC_ARTICLES, ...liveArticles];

    // Sort by date descending
    articles.sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    });

    // Truncate summaries
    articles = articles.map(a => ({
      ...a,
      summary: a.summary
        ? a.summary.replace(/<[^>]*>/g, '').slice(0, 220) + (a.summary.length > 220 ? '...' : '')
        : ''
    }));

    cache = articles;
    cacheTime = now;
    res.json(articles);
  } catch (err) {
    console.error('News fetch error:', err);
    // Fallback to static articles if something goes wrong
    res.json(STATIC_ARTICLES);
  }
});

module.exports = router;
