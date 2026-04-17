import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Dumbbell, Apple, Plus, Trash2, Save, Check, AlertCircle, Users } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes: string;
}

interface WorkoutDay {
  day: string;
  isTrainingDay: boolean;
  focus: string;
  exercises: Exercise[];
}

interface MealOption {
  name: string;
  foods: string[];
}

interface Meal {
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  options: MealOption[];
}

const DAYS = [
  { en: 'Sunday', he: 'ראשון' },
  { en: 'Monday', he: 'שני' },
  { en: 'Tuesday', he: 'שלישי' },
  { en: 'Wednesday', he: 'רביעי' },
  { en: 'Thursday', he: 'חמישי' },
  { en: 'Friday', he: 'שישי' },
  { en: 'Saturday', he: 'שבת' },
];

const DEFAULT_WORKOUT_DAYS: WorkoutDay[] = DAYS.map(d => ({
  day: d.en,
  isTrainingDay: ['Monday', 'Wednesday', 'Friday'].includes(d.en),
  focus: '',
  exercises: []
}));

const DEFAULT_MEALS: Meal[] = [
  { name: 'ארוחת בוקר', time: '07:30', calories: 400, protein: 30, carbs: 45, fat: 15, options: [{ name: 'אפשרות 1', foods: [''] }] },
  { name: 'ארוחת ביניים', time: '10:30', calories: 200, protein: 15, carbs: 20, fat: 8, options: [{ name: 'אפשרות 1', foods: [''] }] },
  { name: 'ארוחת צהריים', time: '13:00', calories: 550, protein: 40, carbs: 60, fat: 18, options: [{ name: 'אפשרות 1', foods: [''] }] },
  { name: 'ארוחת ערב', time: '19:30', calories: 450, protein: 35, carbs: 40, fat: 15, options: [{ name: 'אפשרות 1', foods: [''] }] },
];

export default function PlanEditor() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [tab, setTab] = useState<'workout' | 'nutrition'>('workout');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Workout state
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>(DEFAULT_WORKOUT_DAYS);

  // Nutrition state
  const [dailyCalories, setDailyCalories] = useState(2000);
  const [proteinG, setProteinG] = useState(150);
  const [carbsG, setCarbsG] = useState(200);
  const [fatG, setFatG] = useState(67);
  const [meals, setMeals] = useState<Meal[]>(DEFAULT_MEALS);

  useEffect(() => {
    axios.get('/api/admin/clients')
      .then(res => setClients(res.data))
      .catch(() => {});
  }, []);

  const updateDay = (dayEn: string, updates: Partial<WorkoutDay>) => {
    setWorkoutDays(days => days.map(d => d.day === dayEn ? { ...d, ...updates } : d));
  };

  const addExercise = (dayEn: string) => {
    updateDay(dayEn, {
      exercises: [...(workoutDays.find(d => d.day === dayEn)?.exercises || []), {
        name: '', sets: 3, reps: '10-12', rest: '60 seconds', notes: ''
      }]
    });
  };

  const updateExercise = (dayEn: string, idx: number, updates: Partial<Exercise>) => {
    const day = workoutDays.find(d => d.day === dayEn);
    if (!day) return;
    const exercises = day.exercises.map((ex, i) => i === idx ? { ...ex, ...updates } : ex);
    updateDay(dayEn, { exercises });
  };

  const removeExercise = (dayEn: string, idx: number) => {
    const day = workoutDays.find(d => d.day === dayEn);
    if (!day) return;
    updateDay(dayEn, { exercises: day.exercises.filter((_, i) => i !== idx) });
  };

  const updateMeal = (idx: number, updates: Partial<Meal>) => {
    setMeals(m => m.map((meal, i) => i === idx ? { ...meal, ...updates } : meal));
  };

  const addMeal = () => {
    setMeals(m => [...m, {
      name: 'ארוחה חדשה', time: '12:00', calories: 300, protein: 20, carbs: 30, fat: 10,
      options: [{ name: 'אפשרות 1', foods: [''] }]
    }]);
  };

  const removeMeal = (idx: number) => {
    setMeals(m => m.filter((_, i) => i !== idx));
  };

  const addFoodToOption = (mealIdx: number, optIdx: number) => {
    const meal = meals[mealIdx];
    const option = meal.options[optIdx];
    updateMeal(mealIdx, {
      options: meal.options.map((o, i) => i === optIdx ? { ...o, foods: [...o.foods, ''] } : o)
    });
  };

  const updateFood = (mealIdx: number, optIdx: number, foodIdx: number, value: string) => {
    const meal = meals[mealIdx];
    updateMeal(mealIdx, {
      options: meal.options.map((o, i) => i === optIdx
        ? { ...o, foods: o.foods.map((f, fi) => fi === foodIdx ? value : f) }
        : o
      )
    });
  };

  const saveWorkoutPlan = async () => {
    if (!selectedClient) { setError('בחר לקוח קודם'); return; }
    if (!workoutTitle) { setError('הכנס כותרת לתוכנית'); return; }
    setSaving(true); setError('');
    try {
      await axios.post('/api/admin/plans/workout', {
        user_id: selectedClient,
        title: workoutTitle,
        description: workoutDescription,
        plan_data: { title: workoutTitle, description: workoutDescription, weeklySchedule: workoutDays }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const saveNutritionPlan = async () => {
    if (!selectedClient) { setError('בחר לקוח קודם'); return; }
    setSaving(true); setError('');
    try {
      await axios.post('/api/admin/plans/nutrition', {
        user_id: selectedClient,
        daily_calories: dailyCalories,
        protein_g: proteinG,
        carbs_g: carbsG,
        fat_g: fatG,
        meals
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white mb-1">עריכת תוכניות</h1>
        <p className="text-gray-400">צור ועדכן תוכניות עבור לקוחות</p>
      </div>

      {/* Client selector */}
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <Users className="w-5 h-5 text-primary" />
          <label className="font-semibold text-white">בחר לקוח</label>
        </div>
        <select
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
          className="input-field"
        >
          <option value="">-- בחר לקוח --</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-3 bg-green-400/10 border border-green-400/30 rounded-xl p-4">
          <Check className="w-5 h-5 text-green-400" />
          <p className="text-green-400 text-sm">התוכנית נשמרה בהצלחה!</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-card rounded-xl border border-border">
        <button
          onClick={() => setTab('workout')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'workout' ? 'gradient-bg text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          תוכנית אימונים
        </button>
        <button
          onClick={() => setTab('nutrition')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'nutrition' ? 'gradient-bg text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Apple className="w-4 h-4" />
          תוכנית תזונה
        </button>
      </div>

      {/* Workout plan editor */}
      {tab === 'workout' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">כותרת התוכנית *</label>
              <input value={workoutTitle} onChange={e => setWorkoutTitle(e.target.value)}
                className="input-field" placeholder="תוכנית כושר מותאמת אישית" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">תיאור</label>
              <textarea value={workoutDescription} onChange={e => setWorkoutDescription(e.target.value)}
                className="input-field resize-none" rows={2} placeholder="תיאור התוכנית..." />
            </div>
          </div>

          {/* Days */}
          {workoutDays.map(day => {
            const dayHe = DAYS.find(d => d.en === day.day)?.he || day.day;
            return (
              <div key={day.day} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateDay(day.day, { isTrainingDay: !day.isTrainingDay })}
                      className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                        day.isTrainingDay ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-gray-500'
                      }`}
                    >
                      {day.isTrainingDay && <Check className="w-4 h-4" />}
                    </button>
                    <h3 className="font-semibold text-white">יום {dayHe}</h3>
                    {!day.isTrainingDay && <span className="text-xs text-gray-500 bg-surface px-2 py-0.5 rounded-full">מנוחה</span>}
                  </div>
                  {day.isTrainingDay && (
                    <button
                      onClick={() => addExercise(day.day)}
                      className="flex items-center gap-1 text-sm text-primary hover:text-purple-400 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      הוסף תרגיל
                    </button>
                  )}
                </div>

                {day.isTrainingDay && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">פוקוס האימון</label>
                      <input value={day.focus} onChange={e => updateDay(day.day, { focus: e.target.value })}
                        className="input-field text-sm" placeholder="חזה ותרסיס, רגליים..." />
                    </div>

                    {day.exercises.map((ex, idx) => (
                      <div key={idx} className="bg-surface rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-400">תרגיל {idx + 1}</span>
                          <button onClick={() => removeExercise(day.day, idx)}
                            className="text-gray-500 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input value={ex.name} onChange={e => updateExercise(day.day, idx, { name: e.target.value })}
                          className="input-field text-sm" placeholder="שם התרגיל" />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">סטים</label>
                            <input type="number" value={ex.sets} onChange={e => updateExercise(day.day, idx, { sets: parseInt(e.target.value) })}
                              className="input-field text-sm" min="1" max="10" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">חזרות</label>
                            <input value={ex.reps} onChange={e => updateExercise(day.day, idx, { reps: e.target.value })}
                              className="input-field text-sm" placeholder="8-12" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">מנוחה</label>
                            <input value={ex.rest} onChange={e => updateExercise(day.day, idx, { rest: e.target.value })}
                              className="input-field text-sm" placeholder="60s" />
                          </div>
                        </div>
                        <input value={ex.notes} onChange={e => updateExercise(day.day, idx, { notes: e.target.value })}
                          className="input-field text-sm" placeholder="הערות (אופציונלי)" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={saveWorkoutPlan}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 gradient-bg text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/30"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'שומר...' : 'שמור תוכנית אימונים'}
          </button>
        </div>
      )}

      {/* Nutrition plan editor */}
      {tab === 'nutrition' && (
        <div className="space-y-4">
          {/* Daily targets */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">יעדים יומיים</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'קלוריות', value: dailyCalories, setter: setDailyCalories, color: 'text-white' },
                { label: 'חלבון (g)', value: proteinG, setter: setProteinG, color: 'text-primary' },
                { label: 'פחמימות (g)', value: carbsG, setter: setCarbsG, color: 'text-accent' },
                { label: 'שומן (g)', value: fatG, setter: setFatG, color: 'text-secondary' },
              ].map(({ label, value, setter, color }) => (
                <div key={label}>
                  <label className={`block text-sm font-medium mb-1 ${color}`}>{label}</label>
                  <input
                    type="number"
                    value={value}
                    onChange={e => setter(parseInt(e.target.value) || 0)}
                    className="input-field text-sm"
                    min="0"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 h-2 bg-surface rounded-full overflow-hidden">
              {(() => {
                const total = proteinG * 4 + carbsG * 4 + fatG * 9;
                const p = total > 0 ? Math.round((proteinG * 4 / total) * 100) : 33;
                const c = total > 0 ? Math.round((carbsG * 4 / total) * 100) : 33;
                const f = 100 - p - c;
                return (
                  <>
                    <div className="h-full bg-primary float-left" style={{ width: `${p}%` }} />
                    <div className="h-full bg-accent float-left" style={{ width: `${c}%` }} />
                    <div className="h-full bg-secondary float-left" style={{ width: `${f}%` }} />
                  </>
                );
              })()}
            </div>
          </div>

          {/* Meals */}
          {meals.map((meal, mealIdx) => (
            <div key={mealIdx} className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{meal.name}</h3>
                <button onClick={() => removeMeal(mealIdx)} className="text-gray-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">שם ארוחה</label>
                  <input value={meal.name} onChange={e => updateMeal(mealIdx, { name: e.target.value })}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">שעה</label>
                  <input value={meal.time} onChange={e => updateMeal(mealIdx, { time: e.target.value })}
                    className="input-field text-sm" placeholder="07:30" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">קלוריות</label>
                  <input type="number" value={meal.calories} onChange={e => updateMeal(mealIdx, { calories: parseInt(e.target.value) || 0 })}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs text-primary mb-1 block">חלבון (g)</label>
                  <input type="number" value={meal.protein} onChange={e => updateMeal(mealIdx, { protein: parseInt(e.target.value) || 0 })}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs text-accent mb-1 block">פחמימות (g)</label>
                  <input type="number" value={meal.carbs} onChange={e => updateMeal(mealIdx, { carbs: parseInt(e.target.value) || 0 })}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs text-secondary mb-1 block">שומן (g)</label>
                  <input type="number" value={meal.fat} onChange={e => updateMeal(mealIdx, { fat: parseInt(e.target.value) || 0 })}
                    className="input-field text-sm" />
                </div>
              </div>

              {/* Options */}
              {meal.options.map((opt, optIdx) => (
                <div key={optIdx} className="bg-surface rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-300">{opt.name}</label>
                    <button
                      onClick={() => addFoodToOption(mealIdx, optIdx)}
                      className="text-xs text-primary hover:text-purple-400"
                    >
                      <Plus className="w-3 h-3 inline" /> הוסף מזון
                    </button>
                  </div>
                  {opt.foods.map((food, foodIdx) => (
                    <input key={foodIdx} value={food}
                      onChange={e => updateFood(mealIdx, optIdx, foodIdx, e.target.value)}
                      className="input-field text-sm py-2"
                      placeholder="100g עוף מבושל..." />
                  ))}
                </div>
              ))}
            </div>
          ))}

          <button
            onClick={addMeal}
            className="w-full flex items-center justify-center gap-2 bg-surface border border-dashed border-border text-gray-400 hover:text-white hover:border-primary/50 py-3 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            הוסף ארוחה
          </button>

          <button
            onClick={saveNutritionPlan}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 gradient-bg text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/30"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'שומר...' : 'שמור תוכנית תזונה'}
          </button>
        </div>
      )}
    </div>
  );
}
