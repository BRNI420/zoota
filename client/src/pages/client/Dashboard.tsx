import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  Dumbbell, Apple, MessageCircle, Bell, TrendingUp,
  Play, ChevronLeft, ChevronRight, Flame, Droplets, Zap, Calendar
} from 'lucide-react';

interface WorkoutPlan {
  plan_data: {
    title: string;
    description: string;
    weeklySchedule: Array<{
      day: string;
      isTrainingDay: boolean;
      focus: string;
      exercises: Array<{ name: string; sets: number; reps: string }>;
    }>;
  };
}

interface NutritionPlan {
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meals: Array<{
    name: string;
    time: string;
    calories: number;
    protein: number;
  }>;
}

const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const QUOTES = [
  '"הצלחה היא סכום של מאמצים קטנים, שחוזרים על עצמם יום אחר יום." — ר. קולייר',
  '"גופך שומע כל דבר שמוחך אומר. היה חיובי." — נאומי ג\'יוסון',
  '"אל תחכה לתנאים המושלמים. התחל עכשיו, השתפר בהדרגה."',
  '"כל אימון שעשית שינה אותך לטוב, גם אם לא הרגשת זאת."',
  '"ההבדל בין אימפוסיבל לאפשרי טמון בדטרמינציה של האדם." — טומי לאסורדה',
];

function CircleProgress({ value, max, color, label, size = 80 }: { value: number; max: number; color: string; label: string; size?: number }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="progress-ring">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2A2A4A" strokeWidth="6" />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
          {Math.round(pct * 100)}%
        </span>
      </div>
      <span className="text-xs text-gray-400 text-center">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [water, setWater] = useState(0);
  const todayIdx = new Date().getDay();
  const todayEn = DAYS_EN[todayIdx];
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wpRes, npRes] = await Promise.allSettled([
          axios.get('/api/plans/workout/my'),
          axios.get('/api/plans/nutrition/my'),
        ]);
        if (wpRes.status === 'fulfilled') setWorkoutPlan(wpRes.value.data);
        if (npRes.status === 'fulfilled') setNutritionPlan(npRes.value.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const todayWorkout = workoutPlan?.plan_data?.weeklySchedule?.find(d => d.day === todayEn);

  const requestNotifPermission = async () => {
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  // If no plan yet, prompt onboarding
  if (!workoutPlan && !nutritionPlan) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">ברוך הבא, {user?.name}!</h2>
          <p className="text-gray-400 mb-8">נראה שעדיין לא מילאת את השאלון. בוא נבנה לך תוכנית אישית!</p>
          <button
            onClick={() => navigate('/onboarding')}
            className="gradient-bg text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-primary/30 hover:opacity-90 transition-all"
          >
            התחל עכשיו
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Notification banner */}
      {notifPermission === 'default' && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <p className="text-sm text-gray-300">אפשר התראות לקבל תזכורות ארוחות ואימונים</p>
          </div>
          <button
            onClick={requestNotifPermission}
            className="text-sm font-semibold text-primary hover:text-purple-400 transition-colors whitespace-nowrap"
          >
            אפשר התראות
          </button>
        </div>
      )}

      {/* Welcome + date */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">שלום, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-400 mt-1">{dateStr}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm text-gray-300">{DAYS_HE[todayIdx]}</span>
        </div>
      </div>

      {/* Motivational quote */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-5">
        <p className="text-gray-300 text-sm italic">{quote}</p>
      </div>

      {/* Today's overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today's workout */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-white">אימון היום</h2>
            </div>
            <button
              onClick={() => navigate('/workouts')}
              className="text-sm text-primary hover:text-purple-400 flex items-center gap-1"
            >
              הכל <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {todayWorkout ? (
            todayWorkout.isTrainingDay ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full font-medium">
                    {todayWorkout.focus}
                  </span>
                  <span className="text-gray-400 text-sm">{todayWorkout.exercises?.length || 0} תרגילים</span>
                </div>
                <div className="space-y-2 mb-5">
                  {(todayWorkout.exercises || []).slice(0, 4).map((ex, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-white text-sm">{ex.name}</span>
                      <span className="text-gray-400 text-sm">{ex.sets} × {ex.reps}</span>
                    </div>
                  ))}
                  {(todayWorkout.exercises?.length || 0) > 4 && (
                    <p className="text-gray-500 text-sm">+{(todayWorkout.exercises?.length || 0) - 4} נוספים...</p>
                  )}
                </div>
                <button
                  onClick={() => navigate('/workouts')}
                  className="w-full flex items-center justify-center gap-2 gradient-bg text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  <Play className="w-5 h-5" fill="white" />
                  התחל אימון
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">😴</div>
                <p className="text-white font-semibold mb-1">יום מנוחה</p>
                <p className="text-gray-400 text-sm">תן לגוף להתאושש ולהתחזק</p>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>אין תוכנית אימונים עדיין</p>
            </div>
          )}
        </div>

        {/* Daily macros */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-lg font-bold text-white">מאקרו יומי</h2>
          </div>

          {nutritionPlan ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-black text-white">{nutritionPlan.daily_calories}</p>
                <p className="text-gray-400 text-sm">קלוריות ביום</p>
              </div>
              <div className="flex justify-around">
                <CircleProgress value={nutritionPlan.protein_g} max={200} color="#6C63FF" label={`חלבון\n${nutritionPlan.protein_g}g`} />
                <CircleProgress value={nutritionPlan.carbs_g} max={300} color="#4ECDC4" label={`פחמימות\n${nutritionPlan.carbs_g}g`} />
                <CircleProgress value={nutritionPlan.fat_g} max={100} color="#FF6584" label={`שומן\n${nutritionPlan.fat_g}g`} />
              </div>
              <button
                onClick={() => navigate('/nutrition')}
                className="w-full text-center text-sm text-primary hover:text-purple-400 transition-colors"
              >
                צפה בתפריט המלא
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Apple className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>אין תוכנית תזונה עדיין</p>
            </div>
          )}
        </div>
      </div>

      {/* Today's meals + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meals timeline */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Apple className="w-5 h-5 text-secondary" />
              </div>
              <h2 className="text-lg font-bold text-white">ארוחות היום</h2>
            </div>
            <button onClick={() => navigate('/nutrition')} className="text-sm text-primary hover:text-purple-400 flex items-center gap-1">
              הכל <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {nutritionPlan?.meals?.length ? (
            <div className="space-y-3">
              {nutritionPlan.meals.slice(0, 5).map((meal, i) => {
                const mealHour = parseInt(meal.time?.split(':')[0] || '0');
                const nowHour = new Date().getHours();
                const isPast = mealHour < nowHour;
                const isCurrent = mealHour === nowHour;
                return (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                    isCurrent ? 'bg-primary/10 border border-primary/20' :
                    isPast ? 'opacity-60' : ''
                  }`}>
                    <div className="w-12 text-center">
                      <p className="text-xs font-medium text-gray-400">{meal.time}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      isCurrent ? 'bg-primary shadow-lg shadow-primary/50' :
                      isPast ? 'bg-accent' : 'bg-border'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{meal.name}</p>
                      <p className="text-xs text-gray-400">{meal.calories} קל' | {meal.protein}g חלבון</p>
                    </div>
                    {isCurrent && (
                      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">עכשיו</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>אין ארוחות מתוכננות</p>
            </div>
          )}
        </div>

        {/* Quick actions + water */}
        <div className="space-y-4">
          {/* Water tracker */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Droplets className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white">שתיית מים</h3>
            </div>
            <div className="flex justify-center gap-2 flex-wrap mb-3">
              {Array.from({ length: 8 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setWater(water === i + 1 ? i : i + 1)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
                    i < water
                      ? 'border-blue-400 bg-blue-400/20 text-blue-400'
                      : 'border-border text-gray-500 hover:border-blue-400/50'
                  }`}
                >
                  💧
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-400">{water} / 8 כוסות</p>
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 className="font-bold text-white mb-4">פעולות מהירות</h3>
            <div className="space-y-2">
              {[
                { icon: Dumbbell, label: 'לאימון', color: 'text-primary', to: '/workouts' },
                { icon: Apple, label: 'לתפריט', color: 'text-accent', to: '/nutrition' },
                { icon: MessageCircle, label: 'שאל מאמן AI', color: 'text-secondary', to: '/coach' },
              ].map(({ icon: Icon, label, color, to }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-border transition-all group"
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
                  <ChevronLeft className="w-4 h-4 text-gray-500 ml-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Weekly progress */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-white">ימי האימון בשבוע</h3>
            </div>
            <div className="flex justify-between">
              {DAYS_HE.map((day, i) => {
                const dayEn = DAYS_EN[i];
                const isTraining = workoutPlan?.plan_data?.weeklySchedule?.find(d => d.day === dayEn)?.isTrainingDay;
                const isToday = i === todayIdx;
                return (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isToday ? 'gradient-bg text-white shadow-lg' :
                      isTraining ? 'bg-primary/20 text-primary' : 'bg-surface text-gray-600'
                    }`}>
                      {isTraining ? '💪' : ''}
                    </div>
                    <span className={`text-xs ${isToday ? 'text-primary font-bold' : 'text-gray-500'}`}>
                      {day.charAt(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
