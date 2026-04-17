import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Video, Upload, Trash2, Play, X, AlertCircle, Check, Film } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  description: string;
  filename: string;
  duration: string;
  category: string;
  exercise_name: string;
  instructions: string;
  muscle_groups: string[];
  created_at: string;
}

const CATEGORIES = [
  { value: 'push', label: 'דחיפה (Push)' },
  { value: 'pull', label: 'משיכה (Pull)' },
  { value: 'legs', label: 'רגליים' },
  { value: 'cardio', label: 'קרדיו' },
  { value: 'core', label: 'ליבה (Core)' },
  { value: 'full_body', label: 'גוף מלא' },
  { value: 'other', label: 'אחר' },
];

const MUSCLE_GROUPS = ['חזה', 'גב', 'כתפיים', 'ביספס', 'טריספס', 'ישבן', 'ירכיים', 'חזיות', 'קרדיו', 'ליבה'];

const categoryLabels: Record<string, string> = {
  push: 'דחיפה', pull: 'משיכה', legs: 'רגליים', cardio: 'קרדיו',
  core: 'ליבה', full_body: 'גוף מלא', other: 'אחר'
};

export default function VideoManager() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    exercise_name: '',
    category: 'push',
    instructions: '',
    duration: '',
    muscle_groups: [] as string[],
    file: null as File | null,
  });

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/videos', { params: { category: filterCategory, search } });
      setVideos(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVideos(); }, [filterCategory, search]);

  const toggleMuscleGroup = (mg: string) => {
    setForm(f => ({
      ...f,
      muscle_groups: f.muscle_groups.includes(mg)
        ? f.muscle_groups.filter(x => x !== mg)
        : [...f.muscle_groups, mg]
    }));
  };

  const handleFileSelect = (file: File) => {
    setForm(f => ({ ...f, file }));
    if (!form.title) {
      const name = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setForm(f => ({ ...f, file, title: name }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!form.file || !form.title || !form.exercise_name || !form.category) {
      setUploadError('נא למלא את כל השדות הנדרשים ולבחור קובץ וידאו');
      return;
    }
    setUploadLoading(true);
    setUploadError('');
    try {
      const data = new FormData();
      data.append('video', form.file);
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('exercise_name', form.exercise_name);
      data.append('category', form.category);
      data.append('instructions', form.instructions);
      data.append('duration', form.duration);
      data.append('muscle_groups', JSON.stringify(form.muscle_groups));

      await axios.post('/api/videos/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadSuccess(true);
      setForm({ title: '', description: '', exercise_name: '', category: 'push', instructions: '', duration: '', muscle_groups: [], file: null });
      await fetchVideos();
      setTimeout(() => { setShowUpload(false); setUploadSuccess(false); }, 2000);
    } catch (err: any) {
      setUploadError(err?.response?.data?.error || 'שגיאה בהעלאה');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/videos/${id}`);
      setVideos(v => v.filter(x => x.id !== id));
      setDeleteConfirm(null);
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">ספריית וידאו</h1>
          <p className="text-gray-400">{videos.length} סרטונים</p>
        </div>
        <button
          onClick={() => { setShowUpload(true); setUploadError(''); setUploadSuccess(false); }}
          className="flex items-center gap-2 gradient-bg text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/30"
        >
          <Upload className="w-4 h-4" />
          העלה וידאו
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1 min-w-[200px] text-sm"
          placeholder="חפש תרגיל..."
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="input-field text-sm min-w-[150px]"
        >
          <option value="">כל הקטגוריות</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Video grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16">
          <Film className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">אין סרטונים עדיין</h2>
          <p className="text-gray-400 mb-6">העלה את הסרטון הראשון שלך</p>
          <button
            onClick={() => setShowUpload(true)}
            className="gradient-bg text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90"
          >
            <Upload className="w-4 h-4 inline mr-2" />
            העלה וידאו
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map(video => (
            <div key={video.id} className="card group hover:border-primary/40 transition-all">
              {/* Video thumbnail */}
              <div
                className="aspect-video bg-surface rounded-xl mb-4 flex items-center justify-center cursor-pointer relative overflow-hidden group-hover:bg-primary/5"
                onClick={() => setActiveVideo(video)}
              >
                <video
                  src={`http://localhost:3001/api/videos/stream/${video.filename}`}
                  className="w-full h-full object-cover rounded-xl"
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" fill="white" />
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white flex-1 line-clamp-1">{video.title}</h3>
                <button
                  onClick={() => setDeleteConfirm(video.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-gray-400 mb-2">{video.exercise_name}</p>

              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {categoryLabels[video.category] || video.category}
                </span>
                {video.duration && (
                  <span className="text-xs bg-surface text-gray-400 px-2 py-0.5 rounded-full">
                    {video.duration}
                  </span>
                )}
                {video.muscle_groups?.slice(0, 2).map(mg => (
                  <span key={mg} className="text-xs bg-surface text-gray-400 px-2 py-0.5 rounded-full">{mg}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">מחיקת וידאו</h3>
            <p className="text-gray-400 mb-6">האם אתה בטוח שרוצה למחוק סרטון זה? לא ניתן לשחזר.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-surface border border-border text-gray-300 hover:text-white"
              >ביטול</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600"
              >מחק</button>
            </div>
          </div>
        </div>
      )}

      {/* Video player modal */}
      {activeVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setActiveVideo(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{activeVideo.title}</h3>
              <button onClick={() => setActiveVideo(null)} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
            </div>
            <video controls className="w-full rounded-xl bg-black mb-4"
              src={`http://localhost:3001/api/videos/stream/${activeVideo.filename}`} />
            {activeVideo.instructions && (
              <div className="p-4 bg-surface rounded-xl">
                <p className="text-sm font-medium text-gray-300 mb-1">הוראות ביצוע:</p>
                <p className="text-sm text-gray-400 whitespace-pre-line">{activeVideo.instructions}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !uploadLoading && setShowUpload(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">העלאת וידאו חדש</h3>
              <button onClick={() => !uploadLoading && setShowUpload(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {uploadSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-lg font-bold text-white">הוידאו הועלה בהצלחה!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {uploadError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-red-400 text-sm">{uploadError}</p>
                  </div>
                )}

                {/* Drag & drop area */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    dragOver ? 'border-primary bg-primary/10' :
                    form.file ? 'border-green-400/50 bg-green-400/5' : 'border-border hover:border-primary/50'
                  }`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  {form.file ? (
                    <div>
                      <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-green-400 font-medium">{form.file.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{(form.file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-300">גרור קובץ וידאו לכאן</p>
                      <p className="text-xs text-gray-500 mt-1">או לחץ לבחירה (MP4, AVI, MOV)</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">כותרת *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      className="input-field text-sm" placeholder="שם הסרטון" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">שם תרגיל *</label>
                    <input value={form.exercise_name} onChange={e => setForm(f => ({ ...f, exercise_name: e.target.value }))}
                      className="input-field text-sm" placeholder="Bench Press" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">קטגוריה *</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="input-field text-sm">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">משך</label>
                    <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                      className="input-field text-sm" placeholder="2:30" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">תיאור</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="input-field text-sm" placeholder="תיאור קצר" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">הוראות ביצוע</label>
                  <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                    className="input-field text-sm resize-none" rows={3} placeholder="שלב 1: ...\nשלב 2: ..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">קבוצות שרירים</label>
                  <div className="flex flex-wrap gap-2">
                    {MUSCLE_GROUPS.map(mg => (
                      <button key={mg} type="button" onClick={() => toggleMuscleGroup(mg)}
                        className={`px-3 py-1 rounded-full text-xs border transition-all ${
                          form.muscle_groups.includes(mg)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-surface text-gray-400 hover:border-gray-500'
                        }`}>
                        {mg}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploadLoading}
                  className="w-full gradient-bg text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadLoading ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />מעלה...</>
                  ) : (
                    <><Upload className="w-4 h-4" />העלה וידאו</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
