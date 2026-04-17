const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith('video/') ||
      /\.(mp4|avi|mov|mkv|webm)$/i.test(file.originalname);
    ok ? cb(null, true) : cb(new Error('Only video files are allowed'));
  }
});

// GET /api/videos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM videos';
    const params = [];
    const conditions = [];

    if (category) { conditions.push('category = ?'); params.push(category); }
    if (search) { conditions.push('(title LIKE ? OR exercise_name LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY created_at DESC';

    const videos = await all(sql, params);
    videos.forEach(v => { v.muscle_groups = JSON.parse(v.muscle_groups || '[]'); });
    res.json(videos);
  } catch (err) {
    console.error('Get videos error:', err);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// POST /api/videos/upload (admin)
router.post('/upload', authenticateToken, requireAdmin, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });

    const { title, description, exercise_name, category, instructions, duration, muscle_groups } = req.body;

    if (!title || !exercise_name || !category) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ error: 'Title, exercise name, and category are required' });
    }

    const videoId = uuidv4();
    await run(`
      INSERT INTO videos (id, title, description, filename, duration, category, exercise_name, instructions, muscle_groups, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [videoId, title, description || '', req.file.filename, duration || '',
        category, exercise_name, instructions || '',
        typeof muscle_groups === 'string' ? muscle_groups : JSON.stringify(muscle_groups || []),
        req.user.id]);

    res.status(201).json({ message: 'Video uploaded', id: videoId, filename: req.file.filename });
  } catch (err) {
    console.error('Upload video error:', err);
    if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// DELETE /api/videos/:id (admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const video = await get('SELECT * FROM videos WHERE id = ?', [req.params.id]);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const filePath = path.join(__dirname, '../uploads', video.filename);
    if (fs.existsSync(filePath)) try { fs.unlinkSync(filePath); } catch {}

    await run('DELETE FROM videos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Video deleted' });
  } catch (err) {
    console.error('Delete video error:', err);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// GET /api/videos/stream/:filename
router.get('/stream/:filename', authenticateToken, (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Video not found' });

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4'
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': 'video/mp4' });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error('Stream video error:', err);
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

module.exports = router;
