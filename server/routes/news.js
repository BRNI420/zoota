const express = require('express');
const Parser = require('rss-parser');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'ZOOTA-App/1.0' },
  customFields: { item: ['media:content', 'media:thumbnail', 'enclosure'] }
});

const RSS_FEEDS = [
  {
    url: 'https://www.bodybuilding.com/rss/articles',
    category: 'כושר',
    source: 'Bodybuilding.com'
  },
  {
    url: 'https://www.t-nation.com/feed/',
    category: 'כוח',
    source: 'T-Nation'
  },
  {
    url: 'https://www.nerdfitness.com/blog/feed/',
    category: 'כושר',
    source: 'Nerd Fitness'
  },
  {
    url: 'https://www.healthline.com/rss/nutrition',
    category: 'תזונה',
    source: 'Healthline'
  },
  {
    url: 'https://www.muscleandfitness.com/feed/',
    category: 'שרירים',
    source: 'Muscle & Fitness'
  },
  {
    url: 'https://www.menshealth.com/rss/all.xml/',
    category: 'בריאות',
    source: "Men's Health"
  }
];

// Simple in-memory cache (10 min TTL)
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

async function fetchFeed(feedConfig) {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    return (feed.items || []).slice(0, 8).map(item => ({
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

    const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));
    let articles = [];
    results.forEach(r => {
      if (r.status === 'fulfilled') articles = articles.concat(r.value);
    });

    // Sort by date descending
    articles.sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    });

    // Remove items with no title or link
    articles = articles.filter(a => a.title && a.link);

    // Truncate summaries
    articles = articles.map(a => ({
      ...a,
      summary: a.summary
        ? a.summary.replace(/<[^>]*>/g, '').slice(0, 200) + (a.summary.length > 200 ? '...' : '')
        : ''
    }));

    cache = articles;
    cacheTime = now;

    res.json(articles);
  } catch (err) {
    console.error('News fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

module.exports = router;
