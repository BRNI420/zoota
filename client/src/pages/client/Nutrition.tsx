import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Apple, ChevronDown, ChevronUp, Droplets, Flame, Beef, Wheat, Zap } from 'lucide-react';

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

interface NutritionPlan {
  id: string;
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meals: Meal[];
}

function MacroRing({ label, value, max, color, unit = 'g', icon: Icon }: {
  label: string; value: number; max: number; color: string; unit?: string; icon: React.ElementType;
}) {
  const size = 100;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = circ * pct;

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-surface rounded-2xl">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="progress-ring">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2A2A4A" strokeWidth="8" />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-4 h-4 mb-0.5" style={{ color }} />
          <span className="text-sm font-bold text-white">{value}{unit}</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 font-medium">{label}</span>
    </div>
  );
}

export default function Nutrition() {
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMeal, setExpandedMeal] = useState<number | null>(0);
  const [expandedOption, setExpandedOption] = useState<number>(0);
  const [water, setWater] = useState(0);

  useEffect(() => {
    axios.get('/api/plans/nutrition/my')
      .then(res => setPlan(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Apple className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">אין תוכנית תזונה</h2>
          <p className="text-gray-400">מלא את השאלון כדי לקבל תפריט מותאם</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">תוכנית תזונה</h1>
            <p className="text-gray-400">{plan.meals?.length || 0} ארוחות ביום</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Apple className="w-6 h-6 text-accent" />
          </div>
        </div>

        {/* Daily targets */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-6 py-3">
            <Flame className="w-6 h-6 text-primary" />
            <div>
              <p className="text-3xl font-black text-white">{plan.daily_calories}</p>
              <p className="text-xs text-gray-400">קלוריות ביום</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <MacroRing label="חלבון" value={plan.protein_g} max={250} color="#6C63FF" icon={Beef} />
          <MacroRing label="פחמימות" value={plan.carbs_g} max={400} color="#4ECDC4" icon={Wheat} />
          <MacroRing label="שומן" value={plan.fat_g} max={120} color="#FF6584" icon={Zap} />
        </div>

        {/* Macro bar */}
        <div className="mt-6">
          <div className="flex h-3 rounded-full overflow-hidden bg-surface">
            {(() => {
              const total = plan.protein_g * 4 + plan.carbs_g * 4 + plan.fat_g * 9;
              const p = Math.round((plan.protein_g * 4 / total) * 100);
              const c = Math.round((plan.carbs_g * 4 / total) * 100);
              const f = 100 - p - c;
              return (
                <>
                  <div className="h-full bg-primary transition-all" style={{ width: `${p}%` }} title={`חלבון ${p}%`} />
                  <div className="h-full bg-accent transition-all" style={{ width: `${c}%` }} title={`פחמימות ${c}%`} />
                  <div className="h-full bg-secondary transition-all" style={{ width: `${f}%` }} title={`שומן ${f}%`} />
                </>
              );
            })()}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-primary rounded-full inline-block" />חלבון</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-accent rounded-full inline-block" />פחמימות</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-secondary rounded-full inline-block" />שומן</span>
          </div>
        </div>
      </div>

      {/* Water tracker */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Droplets className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white">מעקב שתייה</h3>
          </div>
          <span className="text-sm text-gray-400">{water} / 8 כוסות</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {Array.from({ length: 8 }, (_, i) => (
            <button
              key={i}
              onClick={() => setWater(water === i + 1 ? i : i + 1)}
              className={`flex-1 min-w-[48px] h-12 rounded-xl border-2 flex items-center justify-center text-lg transition-all ${
                i < water
                  ? 'border-blue-400 bg-blue-400/20 text-blue-400 shadow-lg shadow-blue-400/20'
                  : 'border-border bg-surface text-gray-600 hover:border-blue-400/50'
              }`}
            >
              💧
            </button>
          ))}
        </div>
        <div className="mt-3 h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 rounded-full transition-all duration-300"
            style={{ width: `${(water / 8) * 100}%` }}
          />
        </div>
      </div>

      {/* Meals accordion */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white px-1">תפריט יומי</h2>
        {(plan.meals || []).map((meal, mealIdx) => {
          const nowHour = new Date().getHours();
          const mealHour = parseInt(meal.time?.split(':')[0] || '0');
          const isCurrent = mealHour === nowHour;
          const isExpanded = expandedMeal === mealIdx;

          return (
            <div
              key={mealIdx}
              className={`card transition-all ${isCurrent ? 'border-primary/40 shadow-lg shadow-primary/10' : ''}`}
            >
              <button
                onClick={() => setExpandedMeal(isExpanded ? null : mealIdx)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center text-xs font-bold ${
                    isCurrent ? 'gradient-bg text-white' : 'bg-surface text-gray-400'
                  }`}>
                    <span>{meal.time}</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{meal.name}</h3>
                      {isCurrent && (
                        <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">עכשיו</span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-gray-400">{meal.calories} קל'</span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-primary">{meal.protein}g חלבון</span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-accent">{meal.carbs}g פחמ'</span>
                    </div>
                  </div>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                }
              </button>

              {/* Expanded meal options */}
              {isExpanded && (
                <div className="mt-5 border-t border-border pt-5">
                  {/* Macro breakdown */}
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {[
                      { label: 'קלוריות', value: meal.calories, unit: '', color: 'text-white bg-white/5' },
                      { label: 'חלבון', value: meal.protein, unit: 'g', color: 'text-primary bg-primary/10' },
                      { label: 'פחמימות', value: meal.carbs, unit: 'g', color: 'text-accent bg-accent/10' },
                      { label: 'שומן', value: meal.fat, unit: 'g', color: 'text-secondary bg-secondary/10' },
                    ].map(m => (
                      <div key={m.label} className={`rounded-xl p-3 text-center ${m.color}`}>
                        <p className="font-bold">{m.value}{m.unit}</p>
                        <p className="text-xs opacity-70">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Options tabs */}
                  {meal.options && meal.options.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-3">בחר אפשרות:</p>
                      <div className="flex gap-2 mb-4">
                        {meal.options.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            onClick={() => setExpandedOption(optIdx)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                              expandedOption === optIdx
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'bg-surface text-gray-400 hover:bg-border'
                            }`}
                          >
                            {opt.name}
                          </button>
                        ))}
                      </div>

                      {meal.options[expandedOption] && (
                        <div className="bg-surface rounded-xl p-4 animate-fade-in">
                          <ul className="space-y-2">
                            {meal.options[expandedOption].foods.map((food, fi) => (
                              <li key={fi} className="flex items-center gap-3 text-sm text-gray-300">
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                {food}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
