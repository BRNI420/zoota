import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Dumbbell, Play, ChevronDown, ChevronUp, Clock, RotateCcw, Flame, Video } from 'lucide-react';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  muscleGroups?: string[];
  notes?: string;
}

interface WorkoutDay {
  day: string;
  isTrainingDay: boolean;
  focus: string;
  exercises: Exercise[];
}

interface VideoItem {
  id: string;
  title: string;
  filename: string;
  exercise_name: string;
  instructions: string;
}

interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  plan_data: {
    title: string;
    description: string;
    weeklySchedule: WorkoutDay[];
  };
}

const DAYS_HE: Record<string, string> = {
  Sunday: 'ראשון',
  Monday: 'שני',
  Tuesday: 'שלישי',
  Wednesday: 'רביעי',
  Thursday: 'חמישי',
  Friday: 'שישי',
  Saturday: 'שבת',
};

const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Workouts() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  const todayEn = DAYS_EN[new Date().getDay()];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planRes, videosRes] = await Promise.allSettled([
          axios.get('/api/plans/workout/my'),
          axios.get('/api/videos')
        ]);
        if (planRes.status === 'fulfilled') {
          setPlan(planRes.value.data);
          // Auto-expand today's workout
          const todayDay = planRes.value.data.plan_data?.weeklySchedule?.find(
            (d: WorkoutDay) => d.day === todayEn
          );
          if (todayDay?.isTrainingDay) setExpandedDay(todayEn);
        }
        if (videosRes.status === 'fulfilled') setVideos(videosRes.value.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const findVideoForExercise = (exerciseName: string) => {
    return videos.find(v =>
      v.exercise_name.toLowerCase() === exerciseName.toLowerCase() ||
      exerciseName.toLowerCase().includes(v.exercise_name.toLowerCase()) ||
      v.exercise_name.toLowerCase().includes(exerciseName.toLowerCase())
    );
  };

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
          <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">אין תוכנית אימונים</h2>
          <p className="text-gray-400">מלא את השאלון כדי לקבל תוכנית מותאמת</p>
        </div>
      </div>
    );
  }

  const schedule = plan.plan_data?.weeklySchedule || [];
  const trainingDays = schedule.filter(d => d.isTrainingDay).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{plan.plan_data?.title || plan.title}</h1>
            <p className="text-gray-400">{plan.plan_data?.description || plan.description}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-black text-primary">{trainingDays}</p>
            <p className="text-xs text-gray-400">ימי אימון</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-accent">{7 - trainingDays}</p>
            <p className="text-xs text-gray-400">ימי מנוחה</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-secondary">
              {schedule.reduce((sum, d) => sum + (d.exercises?.length || 0), 0)}
            </p>
            <p className="text-xs text-gray-400">סה"כ תרגילים</p>
          </div>
        </div>
      </div>

      {/* Weekly schedule */}
      <div className="space-y-3">
        {schedule.map((day) => {
          const isToday = day.day === todayEn;
          const isExpanded = expandedDay === day.day;

          return (
            <div
              key={day.day}
              className={`card transition-all duration-200 ${
                isToday ? 'border-primary/40 shadow-lg shadow-primary/10' : ''
              }`}
            >
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isToday ? 'gradient-bg text-white' :
                    day.isTrainingDay ? 'bg-primary/10 text-primary' : 'bg-surface text-gray-500'
                  }`}>
                    {DAYS_HE[day.day]?.charAt(0)}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{DAYS_HE[day.day]}</p>
                      {isToday && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">היום</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {day.isTrainingDay ? day.focus : 'מנוחה'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {day.isTrainingDay && (
                    <span className="text-xs text-gray-500">{day.exercises?.length || 0} תרגילים</span>
                  )}
                  {day.isTrainingDay ? (
                    isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <span className="text-2xl">😴</span>
                  )}
                </div>
              </button>

              {/* Expanded exercises */}
              {isExpanded && day.isTrainingDay && (
                <div className="mt-5 space-y-4 border-t border-border pt-5">
                  {(day.exercises || []).map((ex, idx) => {
                    const video = findVideoForExercise(ex.name);
                    return (
                      <div key={idx} className="bg-surface rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <h4 className="font-semibold text-white">{ex.name}</h4>
                            </div>
                            {ex.muscleGroups && ex.muscleGroups.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {ex.muscleGroups.map(mg => (
                                  <span key={mg} className="text-xs bg-surface border border-border text-gray-400 px-2 py-0.5 rounded-full">
                                    {mg}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {video && (
                            <button
                              onClick={() => setActiveVideo(video)}
                              className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all"
                            >
                              <Video className="w-3.5 h-3.5" />
                              וידאו
                            </button>
                          )}
                        </div>

                        <div className="flex gap-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-300">
                            <RotateCcw className="w-4 h-4 text-primary" />
                            <span>{ex.sets} סטים × {ex.reps}</span>
                          </div>
                          {ex.rest && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-300">
                              <Clock className="w-4 h-4 text-accent" />
                              <span>{ex.rest}</span>
                            </div>
                          )}
                        </div>

                        {ex.notes && (
                          <p className="text-xs text-gray-500 mt-2 border-t border-border/50 pt-2">
                            💡 {ex.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {isToday && (
                    <button className="w-full flex items-center justify-center gap-2 gradient-bg text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 mt-2">
                      <Play className="w-5 h-5" fill="white" />
                      התחל אימון
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{activeVideo.title}</h3>
              <button
                onClick={() => setActiveVideo(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >×</button>
            </div>
            <video
              controls
              className="w-full rounded-xl bg-black"
              src={`http://localhost:3001/api/videos/stream/${activeVideo.filename}`}
            />
            {activeVideo.instructions && (
              <div className="mt-4 p-4 bg-surface rounded-xl">
                <p className="text-sm font-medium text-gray-300 mb-1">הוראות ביצוע:</p>
                <p className="text-sm text-gray-400 whitespace-pre-line">{activeVideo.instructions}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
