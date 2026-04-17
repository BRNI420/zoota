import { useEffect, useRef } from 'react';
import axios from 'axios';

interface Meal {
  name: string;
  time: string;
  calories: number;
  protein: number;
  options?: Array<{ name: string; foods: string[] }>;
}

interface WorkoutDay {
  day: string;
  isTrainingDay: boolean;
  focus: string;
  exercises?: Array<{ name: string }>;
}

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function getDayName() {
  const today = new Date().getDay(); // 0 = Sunday
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today];
}

export default function NotificationManager() {
  const notifiedRef = useRef<Set<string>>(new Set());
  const nutritionPlanRef = useRef<{ meals: Meal[] } | null>(null);
  const workoutPlanRef = useRef<{ weeklySchedule: WorkoutDay[] } | null>(null);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Load plans
    const loadPlans = async () => {
      try {
        const [nutritionRes, workoutRes] = await Promise.allSettled([
          axios.get('/api/plans/nutrition/my'),
          axios.get('/api/plans/workout/my')
        ]);

        if (nutritionRes.status === 'fulfilled') {
          nutritionPlanRef.current = nutritionRes.value.data;
        }
        if (workoutRes.status === 'fulfilled') {
          const wpData = workoutRes.value.data;
          workoutPlanRef.current = wpData.plan_data || null;
        }
      } catch {
        // Plans not available
      }
    };

    loadPlans();

    // Check time every minute
    const interval = setInterval(() => {
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayKey = now.toDateString();

      // Meal reminders
      if (nutritionPlanRef.current?.meals) {
        for (const meal of nutritionPlanRef.current.meals) {
          const notifKey = `${todayKey}-meal-${meal.time}-${meal.name}`;
          if (meal.time === currentTime && !notifiedRef.current.has(notifKey)) {
            notifiedRef.current.add(notifKey);

            const firstOption = meal.options?.[0]?.foods?.slice(0, 2).join(', ') || '';
            const body = `${meal.calories} קלוריות | ${meal.protein}g חלבון${firstOption ? `\n${firstOption}` : ''}`;

            try {
              new Notification(`🍽️ הגיע הזמן ל${meal.name}`, {
                body,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                tag: `meal-${meal.time}`
              });
            } catch {}
          }
        }
      }

      // Workout reminder at 6:00 AM on training days
      if (workoutPlanRef.current?.weeklySchedule) {
        const todayDayName = getDayName();
        const todayWorkout = workoutPlanRef.current.weeklySchedule.find(
          d => d.day === todayDayName && d.isTrainingDay
        );

        if (todayWorkout && currentTime === '06:00') {
          const notifKey = `${todayKey}-workout`;
          if (!notifiedRef.current.has(notifKey)) {
            notifiedRef.current.add(notifKey);
            try {
              new Notification(`💪 יום אימון היום!`, {
                body: `${todayWorkout.focus}\nיש לך ${todayWorkout.exercises?.length || 0} תרגילים היום`,
                icon: '/favicon.svg',
                tag: 'workout-reminder'
              });
            } catch {}
          }
        }
      }

      // Clean up old notification keys (keep only today's)
      notifiedRef.current.forEach(key => {
        if (!key.startsWith(todayKey)) {
          notifiedRef.current.delete(key);
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return null; // No UI needed
}
