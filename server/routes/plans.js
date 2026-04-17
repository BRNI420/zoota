const express = require('express');
const { run, get } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/plans/workout/my
router.get('/workout/my', authenticateToken, async (req, res) => {
  try {
    const plan = await get(
      'SELECT * FROM workout_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    if (!plan) return res.status(404).json({ error: 'No workout plan found' });
    plan.plan_data = JSON.parse(plan.plan_data || '{}');
    res.json(plan);
  } catch (err) {
    console.error('Get workout plan error:', err);
    res.status(500).json({ error: 'Failed to fetch workout plan' });
  }
});

// GET /api/plans/nutrition/my
router.get('/nutrition/my', authenticateToken, async (req, res) => {
  try {
    const plan = await get(
      'SELECT * FROM nutrition_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    if (!plan) return res.status(404).json({ error: 'No nutrition plan found' });
    plan.meals = JSON.parse(plan.meals || '[]');
    res.json(plan);
  } catch (err) {
    console.error('Get nutrition plan error:', err);
    res.status(500).json({ error: 'Failed to fetch nutrition plan' });
  }
});

// PUT /api/plans/workout/:id (admin only)
router.put('/workout/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, plan_data } = req.body;
    const plan = await get('SELECT * FROM workout_plans WHERE id = ?', [req.params.id]);
    if (!plan) return res.status(404).json({ error: 'Workout plan not found' });

    await run(
      'UPDATE workout_plans SET title = ?, description = ?, plan_data = ? WHERE id = ?',
      [title || plan.title, description || plan.description, JSON.stringify(plan_data) || plan.plan_data, req.params.id]
    );
    res.json({ message: 'Workout plan updated' });
  } catch (err) {
    console.error('Update workout plan error:', err);
    res.status(500).json({ error: 'Failed to update workout plan' });
  }
});

// PUT /api/plans/nutrition/:id (admin only)
router.put('/nutrition/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { daily_calories, protein_g, carbs_g, fat_g, meals } = req.body;
    const plan = await get('SELECT * FROM nutrition_plans WHERE id = ?', [req.params.id]);
    if (!plan) return res.status(404).json({ error: 'Nutrition plan not found' });

    await run(
      'UPDATE nutrition_plans SET daily_calories = ?, protein_g = ?, carbs_g = ?, fat_g = ?, meals = ? WHERE id = ?',
      [daily_calories || plan.daily_calories, protein_g || plan.protein_g,
       carbs_g || plan.carbs_g, fat_g || plan.fat_g,
       JSON.stringify(meals) || plan.meals, req.params.id]
    );
    res.json({ message: 'Nutrition plan updated' });
  } catch (err) {
    console.error('Update nutrition plan error:', err);
    res.status(500).json({ error: 'Failed to update nutrition plan' });
  }
});

module.exports = router;
