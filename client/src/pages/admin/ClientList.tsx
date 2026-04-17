import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Search, ChevronDown, ChevronUp, MessageCircle, Dumbbell, Apple, Filter } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  created_at: string;
  goal?: string;
  experience_level?: string;
  workout_plan_id?: string;
  workout_plan_title?: string;
  nutrition_plan_id?: string;
  daily_calories?: number;
}

interface ClientDetail {
  user: { id: string; name: string; email: string };
  questionnaire?: {
    goal: string; age: number; gender: string; height: number; weight: number;
    activity_level: string; dietary_preferences: string; allergies: string[];
    training_days_per_week: number; experience_level: string;
  };
  workoutPlan?: { title: string; description: string };
  nutritionPlan?: { daily_calories: number; protein_g: number; carbs_g: number; fat_g: number };
  recentChats: Array<{ role: string; content: string; created_at: string }>;
}

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [goalFilter, setGoalFilter] = useState('');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientDetail, setClientDetail] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async (s = '', g = '') => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/clients', { params: { search: s, goal: g } });
      setClients(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    fetchClients(val, goalFilter);
  };

  const handleGoalFilter = (val: string) => {
    setGoalFilter(val);
    fetchClients(search, val);
  };

  const toggleClient = async (id: string) => {
    if (expandedClient === id) {
      setExpandedClient(null);
      setClientDetail(null);
      return;
    }
    setExpandedClient(id);
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/admin/clients/${id}`);
      setClientDetail(res.data);
    } catch {}
    finally { setDetailLoading(false); }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return d; }
  };

  const activityLabels: Record<string, string> = {
    sedentary: 'יושבני', light: 'קל', moderate: 'בינוני', active: 'פעיל', very_active: 'מאוד פעיל'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white mb-1">לקוחות</h1>
        <p className="text-gray-400">{clients.length} לקוחות רשומים</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="input-field pr-9 text-sm"
            placeholder="חפש לפי שם או אימייל..."
          />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={goalFilter}
            onChange={e => handleGoalFilter(e.target.value)}
            className="input-field pr-9 text-sm pl-4 appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">כל המטרות</option>
            <option value="lose_weight">חיטוב</option>
            <option value="gain_muscle">בניית מסה</option>
          </select>
        </div>
      </div>

      {/* Client list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">לא נמצאו לקוחות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(client => (
            <div key={client.id} className={`card transition-all ${expandedClient === client.id ? 'border-primary/40' : ''}`}>
              <button
                onClick={() => toggleClient(client.id)}
                className="w-full flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-full gradient-bg flex items-center justify-center text-white font-bold flex-shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="font-semibold text-white">{client.name}</p>
                  <p className="text-sm text-gray-500 truncate">{client.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  {client.goal && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      client.goal === 'lose_weight' ? 'bg-blue-400/10 text-blue-400' : 'bg-orange-400/10 text-orange-400'
                    }`}>
                      {client.goal === 'lose_weight' ? 'חיטוב' : 'מסה'}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    client.workout_plan_id ? 'bg-green-400/10 text-green-400' : 'bg-gray-400/10 text-gray-400'
                  }`}>
                    {client.workout_plan_id ? 'יש תוכנית' : 'אין תוכנית'}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(client.created_at)}</span>
                </div>
                {expandedClient === client.id
                  ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                }
              </button>

              {/* Expanded detail */}
              {expandedClient === client.id && (
                <div className="mt-5 pt-5 border-t border-border">
                  {detailLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : clientDetail ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Questionnaire */}
                      {clientDetail.questionnaire && (
                        <div className="bg-surface rounded-xl p-4">
                          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            פרופיל
                          </h4>
                          <div className="space-y-1.5 text-sm">
                            {[
                              ['מטרה', clientDetail.questionnaire.goal === 'lose_weight' ? 'חיטוב' : 'מסה'],
                              ['גיל', clientDetail.questionnaire.age],
                              ['מין', clientDetail.questionnaire.gender === 'male' ? 'זכר' : 'נקבה'],
                              ['גובה', `${clientDetail.questionnaire.height}cm`],
                              ['משקל', `${clientDetail.questionnaire.weight}kg`],
                              ['פעילות', activityLabels[clientDetail.questionnaire.activity_level] || clientDetail.questionnaire.activity_level],
                              ['ניסיון', clientDetail.questionnaire.experience_level],
                              ['ימי אימון', clientDetail.questionnaire.training_days_per_week],
                              ['תזונה', clientDetail.questionnaire.dietary_preferences],
                            ].map(([k, v]) => (
                              <div key={k} className="flex justify-between">
                                <span className="text-gray-400">{k}:</span>
                                <span className="text-white font-medium">{v}</span>
                              </div>
                            ))}
                            {clientDetail.questionnaire.allergies?.length > 0 && (
                              <div>
                                <span className="text-gray-400">אלרגיות: </span>
                                <span className="text-white">{clientDetail.questionnaire.allergies.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Plans */}
                      <div className="space-y-3">
                        {clientDetail.workoutPlan && (
                          <div className="bg-surface rounded-xl p-4">
                            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                              <Dumbbell className="w-4 h-4 text-primary" />
                              תוכנית אימונים
                            </h4>
                            <p className="text-sm text-gray-300">{clientDetail.workoutPlan.title}</p>
                            {clientDetail.workoutPlan.description && (
                              <p className="text-xs text-gray-500 mt-1">{clientDetail.workoutPlan.description}</p>
                            )}
                          </div>
                        )}
                        {clientDetail.nutritionPlan && (
                          <div className="bg-surface rounded-xl p-4">
                            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                              <Apple className="w-4 h-4 text-accent" />
                              תוכנית תזונה
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-center bg-primary/10 rounded-lg p-2">
                                <p className="font-bold text-primary">{clientDetail.nutritionPlan.daily_calories}</p>
                                <p className="text-gray-400">קלוריות</p>
                              </div>
                              <div className="text-center bg-accent/10 rounded-lg p-2">
                                <p className="font-bold text-accent">{clientDetail.nutritionPlan.protein_g}g</p>
                                <p className="text-gray-400">חלבון</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Recent chats */}
                      {clientDetail.recentChats?.length > 0 && (
                        <div className="bg-surface rounded-xl p-4">
                          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-secondary" />
                            שיחות אחרונות
                          </h4>
                          <div className="space-y-2">
                            {clientDetail.recentChats.slice(0, 3).map((chat, i) => (
                              <div key={i} className={`text-xs p-2 rounded-lg ${
                                chat.role === 'user' ? 'bg-primary/10 text-right' : 'bg-card text-right'
                              }`}>
                                <p className="text-gray-300 line-clamp-2">{chat.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">לא נמצאו נתונים</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
