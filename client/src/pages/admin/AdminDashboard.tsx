import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Video, ClipboardList, TrendingUp, UserPlus, ChevronRight, Activity } from 'lucide-react';

interface Stats {
  totalClients: number;
  activePlans: number;
  totalVideos: number;
  avgCompletion: number;
  recentClients: Array<{ id: string; name: string; email: string; created_at: string }>;
  clientsNeedingPlan: Array<{ id: string; name: string; email: string; goal?: string }>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch { return d; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'סה"כ לקוחות', value: stats?.totalClients || 0, icon: Users, color: 'text-primary bg-primary/10', change: '+12% החודש' },
    { label: 'תוכניות פעילות', value: stats?.activePlans || 0, icon: ClipboardList, color: 'text-accent bg-accent/10', change: 'עדכני' },
    { label: 'וידאו מסלולים', value: stats?.totalVideos || 0, icon: Video, color: 'text-secondary bg-secondary/10', change: 'זמין' },
    { label: 'שיעור השלמה', value: `${stats?.avgCompletion || 0}%`, icon: TrendingUp, color: 'text-green-400 bg-green-400/10', change: 'ממוצע' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white mb-1">לוח בקרה</h1>
        <p className="text-gray-400">סקירה כללית של הפלטפורמה</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="card">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-4`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-white mb-1">{s.value}</p>
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className="text-xs text-gray-600 mt-1">{s.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent registrations */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-white">הרשמות אחרונות</h2>
            </div>
            <button
              onClick={() => navigate('/admin/clients')}
              className="text-sm text-primary hover:text-purple-400 flex items-center gap-1"
            >
              הכל <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {stats?.recentClients?.length ? (
            <div className="space-y-3">
              {stats.recentClients.map(client => (
                <div key={client.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-border transition-all cursor-pointer"
                  onClick={() => navigate('/admin/clients')}>
                  <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{client.name}</p>
                    <p className="text-xs text-gray-500 truncate">{client.email}</p>
                  </div>
                  <span className="text-xs text-gray-600 flex-shrink-0">{formatDate(client.created_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>אין לקוחות חדשים</p>
            </div>
          )}
        </div>

        {/* Clients needing plan */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-secondary" />
              <h2 className="font-bold text-white">ממתינים לתוכנית</h2>
            </div>
            <button
              onClick={() => navigate('/admin/plans')}
              className="text-sm text-primary hover:text-purple-400 flex items-center gap-1"
            >
              צור תוכנית <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {stats?.clientsNeedingPlan?.length ? (
            <div className="space-y-3">
              {stats.clientsNeedingPlan.map(client => (
                <div key={client.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-border transition-all cursor-pointer"
                  onClick={() => navigate('/admin/plans')}>
                  <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-sm flex-shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{client.name}</p>
                    <p className="text-xs text-gray-500 truncate">{client.email}</p>
                  </div>
                  {client.goal && (
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      client.goal === 'lose_weight'
                        ? 'bg-blue-400/10 text-blue-400'
                        : 'bg-orange-400/10 text-orange-400'
                    }`}>
                      {client.goal === 'lose_weight' ? 'חיטוב' : 'מסה'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>כל הלקוחות קיבלו תוכנית</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="font-bold text-white mb-4">פעולות מהירות</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'הוסף וידאו', icon: Video, color: 'bg-secondary/10 text-secondary hover:bg-secondary/20', to: '/admin/videos' },
            { label: 'ניהול לקוחות', icon: Users, color: 'bg-primary/10 text-primary hover:bg-primary/20', to: '/admin/clients' },
            { label: 'עריכת תוכניות', icon: ClipboardList, color: 'bg-accent/10 text-accent hover:bg-accent/20', to: '/admin/plans' },
            { label: 'סטטיסטיקות', icon: TrendingUp, color: 'bg-green-400/10 text-green-400 hover:bg-green-400/20', to: '/admin' },
          ].map(({ label, icon: Icon, color, to }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`${color} rounded-xl p-4 text-center transition-all`}
            >
              <Icon className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">{label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
