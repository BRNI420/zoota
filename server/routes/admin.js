const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalClients = await get("SELECT COUNT(*) as count FROM users WHERE role = 'client'");
    const activePlans = await get('SELECT COUNT(*) as count FROM workout_plans');
    const totalVideos = await get('SELECT COUNT(*) as count FROM videos');
    const clientsWithPlans = await get('SELECT COUNT(DISTINCT user_id) as count FROM workout_plans');

    const totalCount = totalClients.count;
    const avgCompletion = totalCount > 0
      ? Math.round((clientsWithPlans.count / totalCount) * 100) : 0;

    const recentClients = await all(
      "SELECT id, name, email, created_at FROM users WHERE role = 'client' ORDER BY created_at DESC LIMIT 5"
    );

    const clientsNeedingPlan = await all(`
      SELECT u.id, u.name, u.email, u.created_at, q.goal
      FROM users u
      LEFT JOIN questionnaires q ON q.user_id = u.id
      LEFT JOIN workout_plans wp ON wp.user_id = u.id
      WHERE u.role = 'client' AND wp.id IS NULL
      ORDER BY u.created_at DESC
      LIMIT 10
    `);

    res.json({
      totalClients: totalClients.count,
      activePlans: activePlans.count,
      totalVideos: totalVideos.count,
      avgCompletion,
      recentClients,
      clientsNeedingPlan
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/clients
router.get('/clients', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, goal } = req.query;
    let sql = `
      SELECT u.id, u.name, u.email, u.created_at,
        q.goal, q.experience_level,
        wp.id as workout_plan_id, wp.title as workout_plan_title,
        np.id as nutrition_plan_id, np.daily_calories
      FROM users u
      LEFT JOIN questionnaires q ON q.user_id = u.id
      LEFT JOIN workout_plans wp ON wp.user_id = u.id
      LEFT JOIN nutrition_plans np ON np.user_id = u.id
      WHERE u.role = 'client'
    `;
    const params = [];

    if (search) { sql += ' AND (u.name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (goal) { sql += ' AND q.goal = ?'; params.push(goal); }
    sql += ' ORDER BY u.created_at DESC';

    const clients = await all(sql, params);
    res.json(clients);
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/admin/clients/:id
router.get('/clients/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Client not found' });

    const questionnaire = await get('SELECT * FROM questionnaires WHERE user_id = ?', [req.params.id]);
    if (questionnaire) {
      questionnaire.allergies = JSON.parse(questionnaire.allergies || '[]');
      questionnaire.favorite_foods = JSON.parse(questionnaire.favorite_foods || '[]');
      questionnaire.foods_to_avoid = JSON.parse(questionnaire.foods_to_avoid || '[]');
    }

    const workoutPlan = await get(
      'SELECT * FROM workout_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );
    if (workoutPlan) workoutPlan.plan_data = JSON.parse(workoutPlan.plan_data || '{}');

    const nutritionPlan = await get(
      'SELECT * FROM nutrition_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );
    if (nutritionPlan) nutritionPlan.meals = JSON.parse(nutritionPlan.meals || '[]');

    const recentChats = await all(
      'SELECT role, content, created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.params.id]
    );

    res.json({ user, questionnaire, workoutPlan, nutritionPlan, recentChats });
  } catch (err) {
    console.error('Get client details error:', err);
    res.status(500).json({ error: 'Failed to fetch client details' });
  }
});

// POST /api/admin/plans/workout
router.post('/plans/workout', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id, title, description, plan_data } = req.body;
    if (!user_id || !title || !plan_data) {
      return res.status(400).json({ error: 'user_id, title, and plan_data are required' });
    }

    const client = await get("SELECT id FROM users WHERE id = ? AND role = 'client'", [user_id]);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const planId = uuidv4();
    await run(
      'INSERT INTO workout_plans (id, user_id, created_by, title, description, plan_data) VALUES (?, ?, ?, ?, ?, ?)',
      [planId, user_id, req.user.id, title, description || '', JSON.stringify(plan_data)]
    );
    res.status(201).json({ message: 'Workout plan created', id: planId });
  } catch (err) {
    console.error('Create workout plan error:', err);
    res.status(500).json({ error: 'Failed to create workout plan' });
  }
});

// POST /api/admin/plans/nutrition
router.post('/plans/nutrition', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id, daily_calories, protein_g, carbs_g, fat_g, meals } = req.body;
    if (!user_id || !daily_calories) {
      return res.status(400).json({ error: 'user_id and daily_calories are required' });
    }

    const client = await get("SELECT id FROM users WHERE id = ? AND role = 'client'", [user_id]);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const planId = uuidv4();
    await run(
      'INSERT INTO nutrition_plans (id, user_id, created_by, daily_calories, protein_g, carbs_g, fat_g, meals) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [planId, user_id, req.user.id, daily_calories, protein_g || 0, carbs_g || 0, fat_g || 0, JSON.stringify(meals || [])]
    );
    res.status(201).json({ message: 'Nutrition plan created', id: planId });
  } catch (err) {
    console.error('Create nutrition plan error:', err);
    res.status(500).json({ error: 'Failed to create nutrition plan' });
  }
});

module.exports = router;
