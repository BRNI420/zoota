const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Anthropic = require('@anthropic-ai/sdk');
const { run, get } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generatePlanWithAI(profile) {
  const prompt = `You are a professional fitness and nutrition coach. Based on the following client profile, create a detailed, personalized workout and nutrition plan.

Client profile:
- Goal: ${profile.goal === 'lose_weight' ? 'Lose Weight / Get Lean' : 'Gain Muscle Mass'}
- Age: ${profile.age}, Gender: ${profile.gender}
- Height: ${profile.height}cm, Weight: ${profile.weight}kg
- Activity level: ${profile.activity_level}
- Training days per week: ${profile.training_days_per_week}
- Experience: ${profile.experience_level}
- Dietary preferences: ${profile.dietary_preferences}
- Allergies: ${JSON.parse(profile.allergies || '[]').join(', ') || 'None'}
- Favorite foods: ${JSON.parse(profile.favorite_foods || '[]').join(', ') || 'Not specified'}
- Foods to avoid: ${JSON.parse(profile.foods_to_avoid || '[]').join(', ') || 'None'}

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "workoutPlan": {
    "title": "...",
    "description": "...",
    "weeklySchedule": [
      {
        "day": "Sunday",
        "isTrainingDay": true,
        "focus": "Chest & Triceps",
        "exercises": [
          {
            "name": "Bench Press",
            "sets": 4,
            "reps": "8-10",
            "rest": "90 seconds",
            "muscleGroups": ["chest", "triceps"],
            "notes": "Keep elbows at 45 degrees"
          }
        ]
      }
    ]
  },
  "nutritionPlan": {
    "dailyCalories": 2200,
    "protein": 165,
    "carbs": 220,
    "fat": 73,
    "meals": [
      {
        "name": "ארוחת בוקר",
        "time": "07:30",
        "calories": 450,
        "protein": 30,
        "carbs": 50,
        "fat": 15,
        "options": [
          {
            "name": "אפשרות 1",
            "foods": ["3 ביצים מקושקשות", "2 פרוסות לחם מחיטה מלאה", "אבוקדו חצי"]
          },
          {
            "name": "אפשרות 2",
            "foods": ["200g גבינת קוטג'", "גרנולה 50g", "פירות יער 100g"]
          }
        ]
      }
    ]
  }
}

Include all 7 days in weeklySchedule. Include at least 5-6 meals in nutritionPlan. Make training days match the requested training_days_per_week.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = message.content[0].text;
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}

function generateFallbackPlan(profile) {
  const isWeightLoss = profile.goal === 'lose_weight';
  const calories = isWeightLoss
    ? Math.round(profile.weight * 22)
    : Math.round(profile.weight * 33);
  const protein = Math.round(profile.weight * (isWeightLoss ? 2.2 : 2.5));
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  const trainingDays = profile.training_days_per_week || 3;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const trainingIndices = [];
  const step = Math.floor(7 / trainingDays);
  for (let i = 0; i < trainingDays; i++) {
    trainingIndices.push((i * step) % 7);
  }

  const focuses = ['Chest & Triceps', 'Back & Biceps', 'Legs & Glutes', 'Shoulders & Arms', 'Full Body', 'Cardio & Core', 'Active Recovery'];

  const weeklySchedule = days.map((day, idx) => {
    const isTraining = trainingIndices.includes(idx);
    const focusIdx = trainingIndices.indexOf(idx);
    return {
      day,
      isTrainingDay: isTraining,
      focus: isTraining ? focuses[focusIdx % focuses.length] : 'Rest Day',
      exercises: isTraining ? [
        { name: 'Warm Up', sets: 1, reps: '5 minutes', rest: '0', muscleGroups: ['full body'], notes: 'Light cardio and dynamic stretching' },
        { name: 'Main Exercise A', sets: 4, reps: '8-12', rest: '90 seconds', muscleGroups: ['primary'], notes: 'Focus on controlled form' },
        { name: 'Main Exercise B', sets: 3, reps: '10-15', rest: '60 seconds', muscleGroups: ['secondary'], notes: 'Full range of motion' },
        { name: 'Accessory Work', sets: 3, reps: '12-15', rest: '45 seconds', muscleGroups: ['accessory'], notes: 'Mind-muscle connection' },
        { name: 'Cool Down', sets: 1, reps: '5 minutes', rest: '0', muscleGroups: ['full body'], notes: 'Static stretching' }
      ] : []
    };
  });

  return {
    workoutPlan: {
      title: isWeightLoss ? 'תוכנית כושר לירידה במשקל' : 'תוכנית כושר לבניית מסת שריר',
      description: `תוכנית מותאמת אישית ל${trainingDays} ימי אימון בשבוע`,
      weeklySchedule
    },
    nutritionPlan: {
      dailyCalories: calories,
      protein,
      carbs,
      fat,
      meals: [
        {
          name: 'ארוחת בוקר', time: '07:30',
          calories: Math.round(calories * 0.25), protein: Math.round(protein * 0.25),
          carbs: Math.round(carbs * 0.3), fat: Math.round(fat * 0.2),
          options: [
            { name: 'אפשרות 1', foods: ['3 ביצים מקושקשות', '2 פרוסות לחם מחיטה מלאה', 'ירקות טריים'] },
            { name: 'אפשרות 2', foods: ['200g גבינת קוטג\'', 'גרנולה 50g', 'פירות עונה'] }
          ]
        },
        {
          name: 'ארוחת ביניים', time: '10:30',
          calories: Math.round(calories * 0.1), protein: Math.round(protein * 0.1),
          carbs: Math.round(carbs * 0.1), fat: Math.round(fat * 0.1),
          options: [
            { name: 'אפשרות 1', foods: ['תפוח ירוק', '20 שקדים'] },
            { name: 'אפשרות 2', foods: ['יוגורט יווני 150g', 'דבש כפית'] }
          ]
        },
        {
          name: 'ארוחת צהריים', time: '13:00',
          calories: Math.round(calories * 0.3), protein: Math.round(protein * 0.3),
          carbs: Math.round(carbs * 0.3), fat: Math.round(fat * 0.3),
          options: [
            { name: 'אפשרות 1', foods: ['200g חזה עוף', 'אורז לבן 100g', 'ירקות מאודים'] },
            { name: 'אפשרות 2', foods: ['200g סלמון', 'בטטה 150g', 'סלט ירוק גדול'] }
          ]
        },
        {
          name: 'ארוחה לפני אימון', time: '17:00',
          calories: Math.round(calories * 0.15), protein: Math.round(protein * 0.15),
          carbs: Math.round(carbs * 0.15), fat: Math.round(fat * 0.1),
          options: [
            { name: 'אפשרות 1', foods: ['בננה גדולה', 'חמאת בוטנים 2 כפות'] },
            { name: 'אפשרות 2', foods: ['חטיף חלבון', 'תפוז'] }
          ]
        },
        {
          name: 'ארוחת ערב', time: '19:30',
          calories: Math.round(calories * 0.2), protein: Math.round(protein * 0.2),
          carbs: Math.round(carbs * 0.15), fat: Math.round(fat * 0.3),
          options: [
            { name: 'אפשרות 1', foods: ['200g דג לבן', 'ירקות צלויים', 'קינואה 80g'] },
            { name: 'אפשרות 2', foods: ['200g בשר בקר רזה', 'אורז אדום', 'סלט קצוץ'] }
          ]
        }
      ]
    }
  };
}

// POST /api/questionnaire
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      goal, age, gender, height, weight, activity_level,
      dietary_preferences = 'none',
      allergies = [], favorite_foods = [], foods_to_avoid = [],
      training_days_per_week = 3, experience_level = 'beginner'
    } = req.body;

    if (!goal || !age || !gender || !height || !weight || !activity_level) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await get('SELECT id FROM questionnaires WHERE user_id = ?', [req.user.id]);
    if (existing) {
      return res.status(409).json({ error: 'Questionnaire already submitted' });
    }

    const questionnaireId = uuidv4();
    const profile = {
      goal, age, gender, height, weight, activity_level,
      dietary_preferences,
      allergies: JSON.stringify(allergies),
      favorite_foods: JSON.stringify(favorite_foods),
      foods_to_avoid: JSON.stringify(foods_to_avoid),
      training_days_per_week,
      experience_level
    };

    await run(`
      INSERT INTO questionnaires (id, user_id, goal, age, gender, height, weight, activity_level, dietary_preferences, allergies, favorite_foods, foods_to_avoid, training_days_per_week, experience_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [questionnaireId, req.user.id, goal, age, gender, height, weight,
        activity_level, dietary_preferences,
        JSON.stringify(allergies), JSON.stringify(favorite_foods),
        JSON.stringify(foods_to_avoid), training_days_per_week, experience_level]);

    let plan;
    try {
      plan = await generatePlanWithAI(profile);
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError.message);
      plan = generateFallbackPlan(profile);
    }

    const workoutPlanId = uuidv4();
    await run(`
      INSERT INTO workout_plans (id, user_id, created_by, title, description, plan_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [workoutPlanId, req.user.id, req.user.id,
        plan.workoutPlan.title, plan.workoutPlan.description,
        JSON.stringify(plan.workoutPlan)]);

    const nutritionPlanId = uuidv4();
    await run(`
      INSERT INTO nutrition_plans (id, user_id, created_by, daily_calories, protein_g, carbs_g, fat_g, meals)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [nutritionPlanId, req.user.id, req.user.id,
        plan.nutritionPlan.dailyCalories, plan.nutritionPlan.protein,
        plan.nutritionPlan.carbs, plan.nutritionPlan.fat,
        JSON.stringify(plan.nutritionPlan.meals)]);

    res.status(201).json({
      message: 'Questionnaire submitted and plan generated',
      workoutPlanId,
      nutritionPlanId
    });
  } catch (err) {
    console.error('Questionnaire error:', err);
    res.status(500).json({ error: 'Failed to process questionnaire' });
  }
});

// GET /api/questionnaire/my
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const questionnaire = await get('SELECT * FROM questionnaires WHERE user_id = ?', [req.user.id]);
    if (!questionnaire) return res.status(404).json({ error: 'No questionnaire found' });

    questionnaire.allergies = JSON.parse(questionnaire.allergies || '[]');
    questionnaire.favorite_foods = JSON.parse(questionnaire.favorite_foods || '[]');
    questionnaire.foods_to_avoid = JSON.parse(questionnaire.foods_to_avoid || '[]');

    res.json(questionnaire);
  } catch (err) {
    console.error('Get questionnaire error:', err);
    res.status(500).json({ error: 'Failed to fetch questionnaire' });
  }
});

module.exports = router;
