const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Anthropic = require('@anthropic-ai/sdk');
const { run, get, all } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Lazy-init so the key is read at request time, not at module load
function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
  return new Anthropic({ apiKey: key });
}

// POST /api/chat
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const workoutPlan = await get(
      'SELECT plan_data FROM workout_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    const nutritionPlan = await get(
      'SELECT daily_calories, protein_g, carbs_g, fat_g FROM nutrition_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    const questionnaire = await get(
      'SELECT goal, age, gender, height, weight, activity_level, dietary_preferences, allergies FROM questionnaires WHERE user_id = ?',
      [req.user.id]
    );

    let planContext = '';
    if (questionnaire) {
      planContext += `\nUser Profile:
- Goal: ${questionnaire.goal === 'lose_weight' ? 'Lose Weight' : 'Gain Muscle'}
- Age: ${questionnaire.age}, Gender: ${questionnaire.gender}
- Height: ${questionnaire.height}cm, Weight: ${questionnaire.weight}kg
- Activity: ${questionnaire.activity_level}
- Diet: ${questionnaire.dietary_preferences}`;
    }
    if (nutritionPlan) {
      planContext += `\n\nNutrition Plan:
- Daily Calories: ${nutritionPlan.daily_calories}
- Protein: ${nutritionPlan.protein_g}g, Carbs: ${nutritionPlan.carbs_g}g, Fat: ${nutritionPlan.fat_g}g`;
    }
    if (workoutPlan) {
      const wpData = JSON.parse(workoutPlan.plan_data || '{}');
      if (wpData.title) planContext += `\n\nWorkout Plan: ${wpData.title}`;
    }

    const systemPrompt = `You are ZOOTA's AI fitness and nutrition coach. You are helpful, motivating, and knowledgeable.
${planContext ? `You have access to the user's personalized plan:${planContext}` : ''}

You speak in Hebrew when the user speaks Hebrew, and English when they speak English.
You are both a nutrition coach and fitness coach - answer questions about diet, exercises, form, recovery, and motivation.
Keep responses concise but complete. Be warm and encouraging. Use emojis occasionally.`;

    const history = await all(
      'SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.user.id]
    );
    const messages = history.reverse().map(m => ({ role: m.role, content: m.content }));
    messages.push({ role: 'user', content: message });

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages
    });

    const assistantMessage = response.content[0].text;

    await run('INSERT INTO chat_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)',
      [uuidv4(), req.user.id, 'user', message]);
    await run('INSERT INTO chat_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)',
      [uuidv4(), req.user.id, 'assistant', assistantMessage]);

    res.json({ message: assistantMessage });
  } catch (err) {
    console.error('Chat error:', err);
    const fallback = 'מצטער, אני חווה בעיה טכנית כרגע. נסה שוב בעוד כמה שניות.';
    try {
      await run('INSERT INTO chat_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)',
        [uuidv4(), req.user.id, 'user', req.body.message || '']);
      await run('INSERT INTO chat_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)',
        [uuidv4(), req.user.id, 'assistant', fallback]);
    } catch {}
    res.json({ message: fallback });
  }
});

// GET /api/chat/history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const messages = await all(
      'SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?',
      [req.user.id, parseInt(limit), parseInt(offset)]
    );
    res.json(messages);
  } catch (err) {
    console.error('Get chat history error:', err);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// DELETE /api/chat/history
router.delete('/history', authenticateToken, async (req, res) => {
  try {
    await run('DELETE FROM chat_messages WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Chat history cleared' });
  } catch (err) {
    console.error('Clear chat history error:', err);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

module.exports = router;
