import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  Zap, Target, User, Activity, Dumbbell, Apple,
  ChevronLeft, ChevronRight, Check, AlertCircle
} from 'lucide-react';

const STEPS = 5;

const activityLevels = [
  { value: 'sedentary', label: 'יושבני', description: 'בעיקר ישיבה, ללא פעילות' },
  { value: 'light', label: 'קל', description: '1-2 ימי אימון בשבוע' },
  { value: 'moderate', label: 'בינוני', description: '3-4 ימי אימון בשבוע' },
  { value: 'active', label: 'פעיל', description: '5 ימי אימון בשבוע' },
  { value: 'very_active', label: 'מאוד פעיל', description: 'אימונים כפולים, עבודה פיזית' },
];

const allergyOptions = ['גלוטן', 'חלב', 'אגוזים', 'ביצים', 'פירות ים', 'סויה'];
const dietaryOptions = [
  { value: 'none', label: 'ללא הגבלה', icon: '🍖' },
  { value: 'vegetarian', label: 'צמחוני', icon: '🥗' },
  { value: 'vegan', label: 'טבעוני', icon: '🌱' },
];

interface FormData {
  goal: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  activity_level: string;
  training_days_per_week: number;
  experience_level: string;
  dietary_preferences: string;
  allergies: string[];
  favorite_foods: string[];
  foods_to_avoid: string[];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');

  const [form, setForm] = useState<FormData>({
    goal: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activity_level: '',
    training_days_per_week: 3,
    experience_level: 'beginner',
    dietary_preferences: 'none',
    allergies: [],
    favorite_foods: [],
    foods_to_avoid: [],
  });

  const update = (key: keyof FormData, value: any) => setForm(f => ({ ...f, [key]: value }));

  const toggleAllergy = (item: string) => {
    setForm(f => ({
      ...f,
      allergies: f.allergies.includes(item)
        ? f.allergies.filter(a => a !== item)
        : [...f.allergies, item]
    }));
  };

  const addTag = (type: 'favorite_foods' | 'foods_to_avoid', value: string) => {
    if (value.trim() && !form[type].includes(value.trim())) {
      setForm(f => ({ ...f, [type]: [...f[type], value.trim()] }));
    }
  };

  const removeTag = (type: 'favorite_foods' | 'foods_to_avoid', item: string) => {
    setForm(f => ({ ...f, [type]: f[type].filter(x => x !== item) }));
  };

  const validateStep = () => {
    switch (step) {
      case 1: return !!form.goal;
      case 2: return form.age && form.gender && form.height && form.weight;
      case 3: return !!form.activity_level;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      setError('נא למלא את כל השדות הנדרשים');
      return;
    }
    setError('');
    setStep(s => Math.min(s + 1, STEPS));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/questionnaire', {
        ...form,
        age: parseInt(form.age),
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
      });
      await refreshUser();
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'שגיאה בשמירת הנתונים';
      setError(msg === 'Questionnaire already submitted' ? 'כבר מילאת את השאלון' : msg);
      if (msg === 'Questionnaire already submitted') {
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="text-xl font-black text-white">ZOOTA</span>
        </div>
        <span className="text-sm text-gray-400">שלב {step} מתוך {STEPS}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-border">
        <div
          className="h-full gradient-bg transition-all duration-500"
          style={{ width: `${(step / STEPS) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">

          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Goal */}
          {step === 1 && (
            <div className="animate-slide-up">
              <div className="text-center mb-10">
                <Target className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">מה המטרה שלך?</h2>
                <p className="text-gray-400">נבנה תוכנית מותאמת בדיוק בשבילך</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => update('goal', 'lose_weight')}
                  className={`p-8 rounded-2xl border-2 transition-all duration-200 text-center group ${
                    form.goal === 'lose_weight'
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="text-5xl mb-4">🏃</div>
                  <h3 className="text-xl font-bold text-white mb-2">אני רוצה להתחטב</h3>
                  <p className="text-gray-400 text-sm">ירידה במשקל ושיפור הגוף</p>
                  {form.goal === 'lose_weight' && (
                    <div className="mt-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => update('goal', 'gain_muscle')}
                  className={`p-8 rounded-2xl border-2 transition-all duration-200 text-center group ${
                    form.goal === 'gain_muscle'
                      ? 'border-secondary bg-secondary/10 shadow-lg shadow-secondary/20'
                      : 'border-border bg-card hover:border-secondary/50'
                  }`}
                >
                  <div className="text-5xl mb-4">💪</div>
                  <h3 className="text-xl font-bold text-white mb-2">אני רוצה לגדול במסה</h3>
                  <p className="text-gray-400 text-sm">בניית שרירים ועלייה בכוח</p>
                  {form.goal === 'gain_muscle' && (
                    <div className="mt-3 w-8 h-8 bg-secondary rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <div className="animate-slide-up">
              <div className="text-center mb-10">
                <User className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">פרטים אישיים</h2>
                <p className="text-gray-400">נשתמש בנתונים אלה לחישוב הצרכים שלך</p>
              </div>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">גיל</label>
                    <input
                      type="number"
                      value={form.age}
                      onChange={e => update('age', e.target.value)}
                      className="input-field"
                      placeholder="25"
                      min="13"
                      max="90"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">מין</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ v: 'male', l: 'זכר' }, { v: 'female', l: 'נקבה' }].map(g => (
                        <button
                          key={g.v}
                          type="button"
                          onClick={() => update('gender', g.v)}
                          className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                            form.gender === g.v
                              ? 'border-primary bg-primary/10 text-white'
                              : 'border-border bg-surface text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {g.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">גובה (ס"מ)</label>
                    <input
                      type="number"
                      value={form.height}
                      onChange={e => update('height', e.target.value)}
                      className="input-field"
                      placeholder="175"
                      min="100"
                      max="250"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">משקל (ק"ג)</label>
                    <input
                      type="number"
                      value={form.weight}
                      onChange={e => update('weight', e.target.value)}
                      className="input-field"
                      placeholder="75"
                      min="30"
                      max="250"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Activity Level */}
          {step === 3 && (
            <div className="animate-slide-up">
              <div className="text-center mb-10">
                <Activity className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">רמת פעילות</h2>
                <p className="text-gray-400">כמה פעיל אתה בחיי היומיום?</p>
              </div>
              <div className="space-y-3">
                {activityLevels.map(level => (
                  <button
                    key={level.value}
                    onClick={() => update('activity_level', level.value)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      form.activity_level === level.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="text-start">
                      <p className="font-semibold text-white">{level.label}</p>
                      <p className="text-sm text-gray-400">{level.description}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      form.activity_level === level.value ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {form.activity_level === level.value && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Training Preferences */}
          {step === 4 && (
            <div className="animate-slide-up">
              <div className="text-center mb-10">
                <Dumbbell className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">העדפות אימון</h2>
                <p className="text-gray-400">ספר לנו על ניסיונך</p>
              </div>
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    ימי אימון בשבוע: <span className="text-primary font-bold">{form.training_days_per_week}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={form.training_days_per_week}
                    onChange={e => update('training_days_per_week', parseInt(e.target.value))}
                    className="w-full h-2 bg-surface rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {[1,2,3,4,5,6,7].map(n => <span key={n}>{n}</span>)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">רמת ניסיון</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { v: 'beginner', l: 'מתחיל', desc: 'פחות משנה' },
                      { v: 'intermediate', l: 'בינוני', desc: '1-3 שנים' },
                      { v: 'advanced', l: 'מתקדם', desc: '3+ שנים' },
                    ].map(lvl => (
                      <button
                        key={lvl.v}
                        type="button"
                        onClick={() => update('experience_level', lvl.v)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          form.experience_level === lvl.v
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        <p className="font-semibold text-white text-sm">{lvl.l}</p>
                        <p className="text-xs text-gray-400 mt-1">{lvl.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Diet & Preferences */}
          {step === 5 && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <Apple className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">העדפות תזונה</h2>
                <p className="text-gray-400">נתאים את התפריט לטעמך</p>
              </div>
              <div className="space-y-6">
                {/* Dietary */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">סוג תזונה</label>
                  <div className="grid grid-cols-3 gap-3">
                    {dietaryOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('dietary_preferences', opt.value)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          form.dietary_preferences === opt.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{opt.icon}</div>
                        <p className="text-sm font-medium text-white">{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">אלרגיות</label>
                  <div className="flex flex-wrap gap-2">
                    {allergyOptions.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleAllergy(item)}
                        className={`px-4 py-2 rounded-full text-sm border transition-all ${
                          form.allergies.includes(item)
                            ? 'border-secondary bg-secondary/10 text-secondary'
                            : 'border-border bg-surface text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Favorite foods */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">מזונות אהובים</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag('favorite_foods', tagInput); setTagInput(''); } }}
                      className="input-field flex-1 text-sm py-2"
                      placeholder="הקלד ולחץ Enter"
                    />
                    <button
                      type="button"
                      onClick={() => { addTag('favorite_foods', tagInput); setTagInput(''); }}
                      className="px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-purple-600"
                    >הוסף</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.favorite_foods.map(f => (
                      <span key={f} className="flex items-center gap-1 px-3 py-1 bg-accent/10 border border-accent/30 text-accent rounded-full text-sm">
                        {f}
                        <button onClick={() => removeTag('favorite_foods', f)} className="hover:text-white">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Foods to avoid */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">מזונות להימנע</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={avoidInput}
                      onChange={e => setAvoidInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag('foods_to_avoid', avoidInput); setAvoidInput(''); } }}
                      className="input-field flex-1 text-sm py-2"
                      placeholder="הקלד ולחץ Enter"
                    />
                    <button
                      type="button"
                      onClick={() => { addTag('foods_to_avoid', avoidInput); setAvoidInput(''); }}
                      className="px-4 py-2 bg-surface border border-border text-gray-300 rounded-xl text-sm hover:bg-border"
                    >הוסף</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.foods_to_avoid.map(f => (
                      <span key={f} className="flex items-center gap-1 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-sm">
                        {f}
                        <button onClick={() => removeTag('foods_to_avoid', f)} className="hover:text-white">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-4 mt-10">
            {step > 1 && (
              <button
                onClick={() => { setError(''); setStep(s => s - 1); }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface border border-border text-gray-300 hover:text-white hover:bg-border transition-all"
              >
                <ChevronRight className="w-5 h-5" />
                הקודם
              </button>
            )}
            <div className="flex-1" />
            {step < STEPS ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 rounded-xl gradient-bg text-white font-semibold shadow-lg shadow-primary/30 hover:opacity-90 transition-all active:scale-95"
              >
                הבא
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-xl gradient-bg text-white font-semibold shadow-lg shadow-primary/30 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    בונה תוכנית...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    צור תוכנית
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
