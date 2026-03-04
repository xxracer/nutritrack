import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Book,
  BarChart2,
  User,
  Plus,
  Utensils,
  Dumbbell,
  TrendingUp,
  Settings,
  Bell,
  ChevronRight,
  Trash2,
  Camera,
  Check,
  ArrowLeft,
  ArrowRight,
  X,
  Sparkles,
  Clock
} from 'lucide-react';
import type { Profile, FoodLog, WorkoutSession, WeightEntry } from './types';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

// --- Components ---

const BottomNav = ({
  activeTab,
  setActiveTab,
  showQuickActions,
  setShowQuickActions,
  setShowLogMeal,
  setShowLogWorkout
}: {
  activeTab: string,
  setActiveTab: (tab: string) => void,
  showQuickActions: boolean,
  setShowQuickActions: (v: boolean) => void,
  setShowLogMeal: (v: boolean) => void,
  setShowLogWorkout: (v: boolean) => void
}) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-8 pt-3 px-4 z-50 flex justify-around items-center">
    <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-primary' : 'text-slate-400'}`}>
      <Home size={24} fill={activeTab === 'dashboard' ? 'currentColor' : 'none'} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
    </button>
    <button onClick={() => setActiveTab('diary')} className={`flex flex-col items-center gap-1 ${activeTab === 'diary' ? 'text-primary' : 'text-slate-400'}`}>
      <Book size={24} fill={activeTab === 'diary' ? 'currentColor' : 'none'} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Diary</span>
    </button>
    <div className="relative -top-6">
      <button
        onClick={() => setShowQuickActions(!showQuickActions)}
        className="h-14 w-14 rounded-full bg-primary text-slate-900 shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform border-4 border-background-light"
      >
        <Plus size={32} strokeWidth={3} className={`transition-transform ${showQuickActions ? 'rotate-45' : ''}`} />
      </button>

      <AnimatePresence>
        {showQuickActions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickActions(false)}
              className="fixed inset-0 bg-black/20 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-50 w-48"
            >
              <button
                onClick={() => { setShowLogMeal(true); setShowQuickActions(false); }}
                className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                <Utensils size={20} className="text-primary" />
                Log Meal
              </button>
              <button
                onClick={() => { setShowLogWorkout(true); setShowQuickActions(false); }}
                className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                <Dumbbell size={20} className="text-primary" />
                Log Workout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    <button onClick={() => setActiveTab('progress')} className={`flex flex-col items-center gap-1 ${activeTab === 'progress' ? 'text-primary' : 'text-slate-400'}`}>
      <TrendingUp size={24} fill={activeTab === 'progress' ? 'currentColor' : 'none'} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Stats</span>
    </button>
    <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-primary' : 'text-slate-400'}`}>
      <User size={24} fill={activeTab === 'profile' ? 'currentColor' : 'none'} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
    </button>
  </nav>
);

const CircularProgress = ({ value, max, label, unit, color = "#13ec5b" }: { value: number, max: number, label: string, unit: string, color?: string }) => {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  const strokeDasharray = 282.7;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle className="text-slate-100" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="8" />
        <circle
          cx="50" cy="50" fill="none" r="45" stroke={color}
          strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" strokeWidth="8"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-extrabold">{value}</span>
        <span className="text-sm font-medium text-slate-500">/ {max} {unit}</span>
        <span className="text-xs font-bold text-primary mt-1">{percentage}%</span>
      </div>
    </div>
  );
};

const MacroRing = ({ value, max, label, color }: { value: number, max: number, label: string, color: string }) => {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  const strokeDasharray = 251.2;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle className="text-slate-100" cx="50" cy="50" fill="none" r="40" stroke="currentColor" strokeWidth="8" />
          <circle
            cx="50" cy="50" fill="none" r="40" stroke={color}
            strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" strokeWidth="8"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold">{value}g</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs text-slate-500">{max}g</p>
      </div>
    </div>
  );
};

// --- API Helpers ---
const apiFetch = async (url: string, options: any = {}, overrideId?: string) => {
  // Use explicitly provided ID (for Onboarding), or grab from localStorage fallback if user state isn't ready
  const headers = {
    ...options.headers,
    'x-device-id': overrideId || localStorage.getItem('nutritrack_device_id') || 'fallback_id',
  };
  return fetch(url, { ...options, headers });
};

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<string>('');
  const [isLoggingMeal, setIsLoggingMeal] = useState(false);
  const [searchError, setSearchError] = useState<string>('');
  const [showLogMeal, setShowLogMeal] = useState(false);
  const [foodSuggestions, setFoodSuggestions] = useState<any[]>([]);
  const [selectedFoodIndexes, setSelectedFoodIndexes] = useState<number[]>([]);
  const [manualItems, setManualItems] = useState<any[]>([]);
  const [showLogWorkout, setShowLogWorkout] = useState(false);
  const [newMeal, setNewMeal] = useState({ name: '', calories: 0, protein: 0, carbs: 0, fats: 0, mealType: 'Snack' });
  const [currentWorkout, setCurrentWorkout] = useState<any[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedHistoryExercise, setSelectedHistoryExercise] = useState<string>('');

  const uniqueExercises = useMemo(() => {
    return Array.from(
      new Set(
        workoutLogs.flatMap(log => log.exercises?.map((e: any) => e.name) || [])
      )
    ).filter(Boolean) as string[];
  }, [workoutLogs]);

  useEffect(() => {
    if (!selectedHistoryExercise && uniqueExercises.length > 0) {
      setSelectedHistoryExercise(uniqueExercises[0]);
    }
  }, [uniqueExercises, selectedHistoryExercise]);

  const historyData = useMemo(() => {
    if (!selectedHistoryExercise) return null;

    const logsWithEx = workoutLogs
      .map(log => {
        const exItem = log.exercises?.find((e: any) => e.name === selectedHistoryExercise);
        if (!exItem) return null;
        const maxLbs = exItem.sets?.reduce((max: number, set: any) => Math.max(max, Number(set.lbs) || 0), 0) || 0;
        return {
          id: log.id,
          timestamp: log.timestamp || new Date().toISOString(),
          maxLbs
        };
      })
      .filter(Boolean)
      .reverse();

    if (logsWithEx.length === 0) return null;
    const start = logsWithEx[0];
    const best = [...logsWithEx].reduce((prev, curr) => (curr.maxLbs > prev.maxLbs) ? curr : prev, logsWithEx[0]);
    return {
      start,
      best,
      chartData: logsWithEx.slice(-6)
    };
  }, [workoutLogs, selectedHistoryExercise]);

  // Reminders State
  const [reminders, setReminders] = useState({
    breakfast: { active: true, time: '08:00' },
    lunch: { active: true, time: '13:00' },
    workout: { active: true, time: '17:30' },
    dinner: { active: true, time: '20:00' },
  });

  const handleLogWeight = async () => {
    if (!newWeight || !user) return;
    await apiFetch('/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight: parseFloat(newWeight), photo_url: '' })
    }, user.uid);
    setNewWeight('');
    fetchData();
  };

  const handleSuggestFood = async () => {
    if (!newMeal.name || !user) return;
    setIsLoggingMeal(true);
    setFoodSuggestions([]);
    try {
      const res = await apiFetch('/api/food/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMeal.name })
      }, user.uid);
      const data = await res.json();
      if (res.ok && data.options) {
        setFoodSuggestions(data.options);
        // Pre-select all items generated so the user can just 1-click bulk add
        setSelectedFoodIndexes(data.options.map((_: any, i: number) => i));
      } else {
        setSearchError(data.error || 'Failed to parse AI data');
        setManualItems([{ id: Math.random().toString(), name: newMeal.name, calories: '', protein: '', carbs: '', fats: '' }]);
      }
    } catch (e: any) {
      console.error(e);
      setSearchError(e.message || 'Network error');
      setManualItems([{ id: Math.random().toString(), name: newMeal.name, calories: '', protein: '', carbs: '', fats: '' }]);
    } finally {
      setIsLoggingMeal(false);
    }
  };

  // Auto-search after 800ms of typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newMeal.name.length >= 3) {
        handleSuggestFood();
      } else if (newMeal.name.length === 0) {
        setFoodSuggestions([]);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [newMeal.name]);

  const toggleFoodSelection = (index: number) => {
    setSelectedFoodIndexes(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const handleLogSelectedMeals = async () => {
    if (selectedFoodIndexes.length === 0 || !user) return;
    try {
      const selectedOpts = foodSuggestions.filter((_, i) => selectedFoodIndexes.includes(i));

      const combinedName = selectedOpts.map(opt => opt.name).join(' and ');
      const totalCalories = selectedOpts.reduce((sum, opt) => sum + (Number(opt.calories) || 0), 0);
      const totalProtein = selectedOpts.reduce((sum, opt) => sum + (Number(opt.protein) || 0), 0);
      const totalCarbs = selectedOpts.reduce((sum, opt) => sum + (Number(opt.carbs) || 0), 0);
      const totalFats = selectedOpts.reduce((sum, opt) => sum + (Number(opt.fats) || 0), 0);

      await apiFetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: combinedName,
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fats: totalFats,
          mealType: newMeal.mealType
        })
      }, user.uid);

      setNewMeal({ name: '', calories: 0, protein: 0, carbs: 0, fats: 0, mealType: 'Snack' });
      setFoodSuggestions([]);
      setSelectedFoodIndexes([]);
      setShowLogMeal(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualLog = async () => {
    const validItems = manualItems.filter(item => item.name.trim() !== '');
    if (validItems.length === 0 || !user) return;
    try {
      const combinedName = validItems.map(item => item.name.trim()).join(' and ');
      const totalCalories = validItems.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
      const totalProtein = validItems.reduce((sum, item) => sum + (Number(item.protein) || 0), 0);
      const totalCarbs = validItems.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0);
      const totalFats = validItems.reduce((sum, item) => sum + (Number(item.fats) || 0), 0);

      await apiFetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: combinedName,
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fats: totalFats,
          mealType: newMeal.mealType
        })
      }, user.uid);

      setNewMeal({ name: '', calories: 0, protein: 0, carbs: 0, fats: 0, mealType: 'Snack' });
      setFoodSuggestions([]);
      setSelectedFoodIndexes([]);
      setManualItems([]);
      setSearchError('');
      setShowLogMeal(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddExercise = () => {
    setCurrentWorkout([
      ...currentWorkout,
      {
        id: Math.random().toString(),
        name: '',
        sets: [{ id: Math.random().toString(), lbs: '', reps: '', done: false }]
      }
    ]);
  };

  const handleLogWorkout = async () => {
    if (currentWorkout.length === 0 || !user) return;
    await apiFetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercises: currentWorkout })
    }, user.uid);
    setCurrentWorkout([]);
    setShowLogWorkout(false);
    fetchData();
  };

  const fetchData = async () => {
    if (!user) {
      console.log("DEBUG: fetchData called but no user exists");
      return;
    }
    try {
      console.log("DEBUG: Fetching Profile for UID:", user.uid);
      const profileRes = await apiFetch('/api/profile');
      console.log("DEBUG: Profile HTTP Status:", profileRes.status);

      let profileData = null;
      if (profileRes.ok) {
        profileData = await profileRes.json();
        console.log("DEBUG: Profile Data body:", profileData);
      } else {
        console.warn("DEBUG: Profile fetch failed with", profileRes.status);
      }

      if (!profileData || !profileData.name) {
        console.log("DEBUG: Profile is empty or missing name. SHOWING ONBOARDING.");
        setShowOnboarding(true);
        setLoading(false);
        setShowSplash(false);
        return;
      }

      console.log("DEBUG: Profile found. Saving to State and clearing Splash.");
      setProfile(profileData);
      setShowSplash(false);

      // 3. Fetch all other historical data safely
      const [foodRes, workoutRes, weightRes] = await Promise.all([
        apiFetch('/api/food'),
        apiFetch('/api/workouts'),
        apiFetch('/api/weight')
      ]);

      if (foodRes.ok) setFoodLogs(await foodRes.json());
      if (weightRes.ok) setWeightHistory(await weightRes.json());
      if (workoutRes.ok) setWorkoutLogs(await workoutRes.json());

      // 4. Fetch AI Recommendation asynchronously (don't await it blocking the UI)
      apiFetch('/api/food/recommendations')
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          return data;
        })
        .then(data => setRecommendation(data.recommendation))
        .catch(err => console.error("Rec Error:", err));

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchData();
    }
  }, [user]);

  const totals = foodLogs.reduce((acc, log) => ({
    calories: acc.calories + log.calories,
    protein: acc.protein + log.protein,
    carbs: acc.carbs + log.carbs,
    fats: acc.fats + log.fats
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-primary gap-4">
        <Sparkles size={48} className="text-white animate-pulse" />
        <h1 className="text-4xl font-extrabold text-white tracking-tight">NutriTrack</h1>
      </div>
    );
  }

  if (showSplash) {
    return (
      <div className="flex justify-center min-h-screen bg-background-light">
        <div className="w-full max-w-md bg-[#111827] flex flex-col min-h-screen relative shadow-2xl overflow-hidden justify-center items-center p-8 text-center text-white">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-[#111827] mb-8 shadow-[0_0_60px_rgba(19,236,91,0.4)]"
          >
            <TrendingUp size={64} strokeWidth={2.5} />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl font-extrabold mb-4 tracking-tight"
          >
            Nutri<span className="text-primary">Track</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-slate-400 text-lg mb-12"
          >
            Your AI-powered journey to a healthier you starts here.
          </motion.p>
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            onClick={() => setShowSplash(false)}
            className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-extrabold text-lg py-5 rounded-2xl shadow-[0_10px_40px_rgba(19,236,91,0.3)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
          >
            Get Started
            <ArrowRight size={24} />
          </motion.button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Sparkles size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">NutriTrack</h1>
          <p className="text-slate-500 font-medium pb-4">Sign in to sync your macros and workouts across all your devices.</p>
          <button
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full bg-white border-2 border-slate-200 hover:border-primary/50 text-slate-700 font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background-light gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-slate-500 font-medium">Loading NutriTrack...</p>
        <button
          onClick={() => setLoading(false)}
          className="mt-4 text-xs text-slate-400 underline"
        >
          Taking too long? Click here.
        </button>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding userUid={user.uid} onComplete={() => { setShowOnboarding(false); fetchData(); }} initialProfile={profile} apiFetch={apiFetch} />;
  }

  return (
    <div className="flex justify-center min-h-screen bg-background-light">
      <div className="w-full max-w-md bg-white flex flex-col min-h-screen relative shadow-2xl overflow-hidden pb-24">

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1"
            >
              <div className="flex items-center justify-between p-4 pt-12 pb-2">
                <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
                <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <Bell size={20} />
                </button>
              </div>

              <h1 className="text-[28px] font-extrabold leading-tight tracking-tight px-4 text-left pb-6 pt-2">
                Welcome back, {profile?.name || 'Alex'}!
              </h1>

              <div className="flex justify-center items-center py-6">
                <CircularProgress
                  value={totals.calories}
                  max={profile?.daily_calories || 2000}
                  label="Calories"
                  unit="kcal"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 px-4 py-6">
                <MacroRing
                  value={totals.protein}
                  max={profile?.daily_protein || 150}
                  label="Protein"
                  color="#13ec5b"
                />
                <MacroRing
                  value={totals.carbs}
                  max={profile?.daily_carbs || 200}
                  label="Carbs"
                  color="#eab308"
                />
                <MacroRing
                  value={totals.fats}
                  max={profile?.daily_fats || 65}
                  label="Fats"
                  color="#ef4444"
                />
              </div>

              <div className="px-4 py-6 space-y-4">
                <button
                  onClick={() => setShowLogMeal(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20"
                >
                  <Plus size={20} strokeWidth={3} />
                  Log a Meal
                </button>
                <button
                  onClick={() => setShowLogWorkout(true)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Dumbbell size={20} />
                  Log a Workout
                </button>
                <p className="text-center text-sm font-medium text-slate-500">
                  {Math.max(0, (profile?.daily_calories || 2000) - totals.calories)} kcal remaining today
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'diary' && (
            <motion.div
              key="diary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 p-4 pt-12"
            >
              <h2 className="text-2xl font-bold mb-6">Daily Diary</h2>

              {recommendation && (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-6 flex gap-3">
                  <div className="mt-1">
                    <Sparkles className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 mb-1">AI Suggestion</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{recommendation}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {foodLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Utensils size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No meals logged today</p>
                  </div>
                ) : (
                  foodLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                            {log.mealType || 'Snack'}
                          </span>
                          <h3 className="font-bold text-base leading-tight">{log.name}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="font-medium text-slate-900">{log.calories} kcal</span>
                          <span>•</span>
                          <span>P: {log.protein}g</span>
                          <span>C: {log.carbs}g</span>
                          <span>F: {log.fats}g</span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!user) return;
                          try {
                            const res = await apiFetch(`/api/food/${log.id}`, { method: 'DELETE' }, user.uid);
                            if (res.ok) {
                              setFoodLogs(foodLogs.filter(item => item.id !== log.id));
                              await fetchData();
                            }
                          } catch (err) {
                            console.error("Failed to delete log", err);
                          }
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 p-4 pt-12"
            >
              <h2 className="text-2xl font-bold mb-6">Progress Tracker</h2>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Update Weight</h3>
                <div className="space-y-4">
                  <input
                    type="number"
                    placeholder="Current Weight (lbs)"
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleLogWeight}
                    className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-primary/20"
                  >
                    Save Entry
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-4">History</h3>
              <div className="space-y-3">
                {weightHistory.map(entry => (
                  <div key={entry.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                      {entry.photo_url ? (
                        <img src={entry.photo_url} alt="Progress" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={24} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 font-medium">{new Date(entry.timestamp).toLocaleDateString()}</p>
                      <h4 className="text-lg font-bold">{entry.weight} lbs</h4>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                  </div>
                ))}
              </div>
              <h3 className="text-xl font-bold mb-6 mt-12 flex items-center justify-between">
                Lift History
                <Settings size={20} className="text-slate-400" />
              </h3>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
                <p className="text-sm text-slate-500 font-bold mb-2">Select Exercise</p>

                <div className="relative w-full bg-slate-50 rounded-xl border border-slate-100 mb-6">
                  <select
                    className="w-full bg-transparent p-4 font-bold text-slate-800 appearance-none focus:outline-none"
                    value={selectedHistoryExercise}
                    onChange={(e) => setSelectedHistoryExercise(e.target.value)}
                  >
                    {uniqueExercises.length === 0 && <option value="">No exercises logged</option>}
                    {uniqueExercises.map((ex) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                  <ChevronRight size={18} className="text-green-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                </div>

                {historyData ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="border border-slate-100 p-4 rounded-xl bg-slate-50 relative overflow-hidden">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                          <Clock size={14} /> START
                        </div>
                        <p className="text-3xl font-black text-slate-900 mb-1">{historyData.start.maxLbs} <span className="text-sm font-medium text-slate-400">lbs</span></p>
                        <p className="text-xs text-slate-400">
                          {new Date(historyData.start.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="border border-green-100 p-4 rounded-xl bg-green-50 relative overflow-hidden shadow-[inset_0_2px_10px_rgba(34,197,94,0.05)]">
                        <div className="flex items-center gap-2 text-xs font-bold text-green-500 uppercase tracking-widest mb-3">
                          <TrendingUp size={14} /> BEST
                        </div>
                        <p className="text-3xl font-black text-slate-900 mb-1">{historyData.best.maxLbs} <span className="text-sm font-medium text-slate-400">lbs</span></p>
                        <p className="text-xs text-slate-400">
                          {new Date(historyData.best.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <h4 className="font-bold text-lg mb-4">Weight Progression</h4>
                    {historyData.chartData.length > 0 && (
                      <>
                        <div className="h-48 flex items-end justify-between gap-2 px-2 pb-6 border-b border-slate-100">
                          {historyData.chartData.map((dataPoint: any, index: number) => {
                            // Calculate height relative to the best max weight mapping highest to 90% height minimum 20%
                            const heightPercent = historyData.best.maxLbs > 0
                              ? Math.max(20, (dataPoint.maxLbs / historyData.best.maxLbs) * 90)
                              : 20;

                            // Calculate color shade mapping relative height
                            const isHighest = dataPoint.maxLbs === historyData.best.maxLbs;

                            return (
                              <div key={index} className={`w-full rounded-t-sm relative flex flex-col justify-end transition-all`}
                                style={{ height: `${heightPercent}%`, backgroundColor: isHighest ? '#22c55e' : `rgba(34, 197, 94, ${0.2 + (heightPercent / 100) * 0.6})` }}>

                                {isHighest && (
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap z-10">
                                    {dataPoint.maxLbs} lbs
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        <div className="flex justify-between mt-3 text-xs text-slate-400 font-medium px-2">
                          {historyData.chartData.map((dataPoint: any, index: number) => (
                            <span key={index}>{new Date(dataPoint.timestamp).toLocaleDateString('en-US', { month: 'short' })}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                    <Dumbbell size={24} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-bold">Log this exercise to see history</p>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold mb-4">Recent Logs</h3>
              <div className="space-y-4 mb-24">
                {workoutLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-slate-100">
                    <Dumbbell size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-bold">No history found</p>
                  </div>
                ) : (
                  workoutLogs.map(log =>
                    log.exercises?.map((exercise: any, i: number) => {
                      const maxLbs = exercise.sets?.reduce((max: number, set: any) => Math.max(max, Number(set.lbs) || 0), 0) || 0;
                      return (
                        <div key={`${log.id}-${i}`} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:border-green-500/30 transition-colors">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Clock size={20} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 mb-1">
                              {log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">{exercise.name} • Max Set</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-lg text-green-500">{maxLbs > 0 ? maxLbs : '-'} lbs</p>
                            <p className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-block mt-1 font-bold">
                              + {(Math.random() * 10).toFixed(0)} LBS
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )
                )}
              </div>

            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 p-4 pt-12"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Profile</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await signOut(auth);
                      setProfile(null);
                    }}
                    className="p-2 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <button
                    onClick={() => setShowOnboarding(true)}
                    className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <Settings size={20} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4 border-4 border-white shadow-lg">
                  <User size={48} />
                </div>
                <h3 className="text-xl font-bold">{profile?.name}</h3>
                <p className="text-slate-500">{profile?.goal.replace('_', ' ')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Weight</p>
                  <p className="text-lg font-bold">{profile?.weight_lbs} lbs</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Height</p>
                  <p className="text-lg font-bold">{profile?.height_ft}'{profile?.height_in}"</p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-bold px-2">Reminders</h3>
                <div className="space-y-2">
                  {[
                    { key: 'breakfast', label: 'Breakfast' },
                    { key: 'lunch', label: 'Lunch' },
                    { key: 'workout', label: 'Workout' },
                    { key: 'dinner', label: 'Dinner' },
                  ].map((reminder, i) => {
                    const rData = reminders[reminder.key as keyof typeof reminders];
                    const isActive = rData.active;
                    return (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-bold">{reminder.label}</p>
                          <input
                            type="time"
                            className="text-xs text-slate-500 bg-transparent border-none p-0 focus:ring-0 mt-1"
                            value={rData.time}
                            onChange={(e) => setReminders({
                              ...reminders,
                              [reminder.key]: { ...rData, time: e.target.value }
                            })}
                          />
                        </div>
                        <button
                          onClick={() => setReminders({ ...reminders, [reminder.key]: { ...rData, active: !isActive } })}
                          className={`w-12 h-6 rounded-full relative transition-colors ${isActive ? 'bg-primary' : 'bg-slate-300'}`}
                        >
                          <motion.div
                            animate={{ x: isActive ? 24 : 4 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="w-full py-4 rounded-xl border-2 border-slate-100 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Edit Goals
                </button>
                <button
                  onClick={() => {
                    // Logic to clear local state when logging out
                    setProfile(null);
                    setShowSplash(true);
                  }}
                  className="w-full py-4 rounded-xl bg-red-50 text-red-500 font-bold hover:bg-red-100 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showQuickActions={showQuickActions}
          setShowQuickActions={setShowQuickActions}
          setShowLogMeal={setShowLogMeal}
          setShowLogWorkout={setShowLogWorkout}
        />

        {/* --- Modals --- */}

        <AnimatePresence>
          {showLogMeal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center"
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-12"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Log Food</h2>
                  <button onClick={() => setShowLogMeal(false)} className="p-2 rounded-full bg-slate-100">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  {foodSuggestions.length === 0 ? (
                    <>
                      <div className="flex gap-2 mb-2 overflow-x-auto pb-2 custom-scrollbar">
                        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => (
                          <button
                            key={type}
                            onClick={() => setNewMeal({ ...newMeal, mealType: type })}
                            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${newMeal.mealType === type ? 'bg-primary text-slate-900 shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text" placeholder="Type a food (e.g. cafe, steak, salad)..."
                        value={newMeal.name} onChange={e => setNewMeal({ ...newMeal, name: e.target.value })}
                        className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary"
                        disabled={isLoggingMeal}
                      />
                      {isLoggingMeal && (
                        <div className="flex items-center justify-center gap-2 py-4 text-primary font-bold">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          Searching the database...
                        </div>
                      )}
                      {searchError && (
                        <div className="bg-orange-50 rounded-xl p-4 mt-4 border border-orange-100 max-h-96 overflow-y-auto custom-scrollbar">
                          <p className="font-bold text-orange-600 text-sm mb-4">Oops, the AI couldn't find it. You can enter items manually:</p>
                          <div className="space-y-4">
                            {manualItems.map((item, index) => (
                              <div key={item.id} className="p-3 bg-white rounded-xl shadow-sm border border-orange-100 space-y-3 relative">
                                {manualItems.length > 1 && (
                                  <button onClick={() => setManualItems(manualItems.filter((_, i) => i !== index))} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 bg-white rounded-full p-1 z-10 transition-colors">
                                    <X size={16} strokeWidth={3} />
                                  </button>
                                )}
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Food Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Yuca Frita"
                                    value={item.name}
                                    onChange={e => {
                                      const newItems = [...manualItems];
                                      newItems[index].name = e.target.value;
                                      setManualItems(newItems);
                                    }}
                                    className="w-full p-2.5 rounded-lg bg-slate-50 border-none focus:ring-2 focus:ring-primary font-bold text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Calories (kcal)</label>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={item.calories}
                                    onChange={e => {
                                      const newItems = [...manualItems];
                                      newItems[index].calories = e.target.value;
                                      setManualItems(newItems);
                                    }}
                                    className="w-full p-2.5 rounded-lg bg-slate-50 border-none focus:ring-2 focus:ring-primary text-sm font-bold"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">P (g)</label>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={item.protein}
                                      onChange={e => {
                                        const newItems = [...manualItems];
                                        newItems[index].protein = e.target.value;
                                        setManualItems(newItems);
                                      }}
                                      className="w-full p-2 rounded-lg bg-slate-50 border-none focus:ring-2 focus:ring-primary text-sm font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">C (g)</label>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={item.carbs}
                                      onChange={e => {
                                        const newItems = [...manualItems];
                                        newItems[index].carbs = e.target.value;
                                        setManualItems(newItems);
                                      }}
                                      className="w-full p-2 rounded-lg bg-slate-50 border-none focus:ring-2 focus:ring-primary text-sm font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">F (g)</label>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={item.fats}
                                      onChange={e => {
                                        const newItems = [...manualItems];
                                        newItems[index].fats = e.target.value;
                                        setManualItems(newItems);
                                      }}
                                      className="w-full p-2 rounded-lg bg-slate-50 border-none focus:ring-2 focus:ring-primary text-sm font-bold"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() => setManualItems([...manualItems, { id: Math.random().toString(), name: '', calories: '', protein: '', carbs: '', fats: '' }])}
                              className="w-full py-3 border-2 border-dashed border-orange-300 text-orange-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-orange-100/50 transition-colors"
                            >
                              <Plus size={18} /> Add Another Item
                            </button>
                            <button
                              onClick={handleManualLog}
                              className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-primary/20 mt-4 transition-colors"
                            >
                              Save {manualItems.length} {manualItems.length === 1 ? 'Item' : 'Items'} Manually
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-sm text-slate-500">Select items to log:</p>
                        <button
                          onClick={() => {
                            setFoodSuggestions([]);
                            setSelectedFoodIndexes([]);
                            setNewMeal({ ...newMeal, name: '' });
                          }}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Clear Search
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {foodSuggestions.map((opt, i) => {
                          const isSelected = selectedFoodIndexes.includes(i);
                          return (
                            <button
                              key={i}
                              onClick={() => toggleFoodSelection(i)}
                              className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100 bg-white hover:border-primary/50 hover:bg-primary/5'}`}
                            >
                              <div className="w-14 h-14 rounded-lg bg-slate-100 shrink-0 overflow-hidden shadow-sm">
                                <img src={`https://loremflickr.com/100/100/${encodeURIComponent(opt.image_term || 'food')}`} alt={opt.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-slate-900 leading-tight mb-1">{opt.name}</p>
                                <div className="flex gap-2 text-xs text-slate-500">
                                  <span className="font-bold text-slate-700">{opt.calories} kcal</span>
                                  <span>P:{opt.protein}g</span>
                                  <span>C:{opt.carbs}g</span>
                                  <span>F:{opt.fats}g</span>
                                </div>
                              </div>
                              <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-slate-900' : 'border-slate-300'}`}>
                                {isSelected && <Check size={14} strokeWidth={3} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {selectedFoodIndexes.length > 0 && (
                        <button
                          onClick={handleLogSelectedMeals}
                          className="w-full mt-4 bg-primary hover:bg-primary/90 text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-colors"
                        >
                          Log {selectedFoodIndexes.length} {selectedFoodIndexes.length === 1 ? 'Item' : 'Items'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {showLogWorkout && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-[60] flex flex-col justify-end"
            >
              <div className="flex-1 overflow-y-auto bg-[#1a1c23] w-full text-white pt-12 pb-24 px-4 custom-scrollbar">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setShowLogWorkout(false)} className="p-2">
                    <ArrowLeft size={24} />
                  </button>
                  <h2 className="text-xl font-bold">Log Workout</h2>
                  <button onClick={handleLogWorkout} className="text-green-500 font-bold p-2">
                    Save
                  </button>
                </div>

                {/* Add Exercise */}
                <button
                  onClick={handleAddExercise}
                  className="w-full bg-[#2a2d36] text-slate-300 font-bold py-4 rounded-xl flex items-center justify-center gap-2 mb-8"
                >
                  <Plus size={20} />
                  Add Custom Exercise
                </button>

                {/* Exercises List */}
                <div className="space-y-8">
                  {currentWorkout.map((exercise, eIndex) => (
                    <div key={exercise.id}>
                      <div className="flex justify-between items-center mb-4">
                        <input
                          type="text"
                          placeholder="Exercise Name..."
                          value={exercise.name}
                          onChange={e => {
                            const newWorkout = [...currentWorkout];
                            newWorkout[eIndex].name = e.target.value;
                            setCurrentWorkout(newWorkout);
                          }}
                          className="bg-transparent text-xl font-bold text-white border-none focus:ring-0 p-0 w-3/4"
                        />
                        <button className="text-slate-500"><Settings size={20} /></button>
                      </div>

                      {/* Sets Header */}
                      <div className="grid grid-cols-4 gap-2 text-xs font-bold text-slate-500 mb-2 px-2 uppercase tracking-wide">
                        <div className="text-center">Set</div>
                        <div className="text-center">LBS</div>
                        <div className="text-center">Reps</div>
                        <div className="text-center">Done</div>
                      </div>

                      {/* Sets Rows */}
                      <div className="space-y-2 mb-4">
                        {exercise.sets.map((set: any, sIndex: number) => (
                          <div key={set.id} className="grid grid-cols-4 gap-2 items-center">
                            <div className="bg-[#2a2d36] rounded-lg p-3 text-center font-bold text-slate-400">
                              {sIndex + 1}
                            </div>
                            <input
                              type="number"
                              value={set.lbs}
                              onChange={e => {
                                const newWorkout = [...currentWorkout];
                                newWorkout[eIndex].sets[sIndex].lbs = e.target.value === '' ? '' : Number(e.target.value);
                                setCurrentWorkout(newWorkout);
                              }}
                              className="bg-[#2a2d36] rounded-lg p-3 text-center text-white font-bold border-none focus:ring-1 focus:ring-green-500"
                              placeholder="-"
                            />
                            <input
                              type="number"
                              value={set.reps}
                              onChange={e => {
                                const newWorkout = [...currentWorkout];
                                newWorkout[eIndex].sets[sIndex].reps = e.target.value === '' ? '' : Number(e.target.value);
                                setCurrentWorkout(newWorkout);
                              }}
                              className="bg-[#2a2d36] rounded-lg p-3 text-center text-white font-bold border-none focus:ring-1 focus:ring-green-500"
                              placeholder="-"
                            />
                            <div className="flex justify-center">
                              <button
                                onClick={() => {
                                  const newWorkout = [...currentWorkout];
                                  newWorkout[eIndex].sets[sIndex].done = !set.done;
                                  setCurrentWorkout(newWorkout);
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${set.done ? 'bg-green-500 text-white' : 'bg-[#2a2d36] text-slate-500'
                                  }`}
                              >
                                <Check size={20} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Set Button */}
                      <button
                        onClick={() => {
                          const newWorkout = [...currentWorkout];
                          newWorkout[eIndex].sets.push({ id: Math.random().toString(), lbs: '', reps: '', done: false });
                          setCurrentWorkout(newWorkout);
                        }}
                        className="w-full border border-dashed border-green-500/50 text-green-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-500/10 transition-colors"
                      >
                        <Plus size={16} /> ADD SET
                      </button>
                    </div>
                  ))}
                </div>

                {currentWorkout.length > 0 && (
                  <button
                    onClick={handleLogWorkout}
                    className="w-full bg-green-500 hover:bg-green-600 text-slate-900 font-bold py-4 rounded-xl mt-12 mb-8 shadow-lg shadow-green-500/20"
                  >
                    Finish Workout
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Onboarding Flow ---

function Onboarding({ userUid, onComplete, initialProfile, apiFetch }: { userUid: string, onComplete: () => void, initialProfile?: Profile | null, apiFetch: any }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Profile>>(initialProfile || {
    name: '',
    age: 25,
    gender: 'male',
    height_ft: 5,
    height_in: 10,
    weight_lbs: 160,
    goal: 'maintain',
    daily_calories: 2000,
    daily_protein: 150,
    daily_carbs: 200,
    daily_fats: 65
  });

  const calculateTargets = () => {
    // Basic BMR calculation (Mifflin-St Jeor)
    const weightKg = (formData.weight_lbs || 160) * 0.453592;
    const heightCm = ((formData.height_ft || 5) * 30.48) + ((formData.height_in || 10) * 2.54);
    const age = formData.age || 25;

    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    bmr = formData.gender === 'male' ? bmr + 5 : bmr - 161;

    // TDEE (Sedentary factor)
    let tdee = bmr * 1.2;

    // Adjust based on goal
    switch (formData.goal) {
      case 'lose_weight': tdee -= 500; break;
      case 'aggressive_cut': tdee -= 750; break;
      case 'gain_muscle': tdee += 300; break;
      case 'dirty_bulk': tdee += 500; break;
    }

    const calories = Math.round(tdee);
    const protein = Math.round(weightKg * 2); // 2g per kg
    const fats = Math.round((calories * 0.25) / 9); // 25% of calories
    const carbs = Math.round((calories - (protein * 4) - (fats * 9)) / 4);

    setFormData(prev => ({
      ...prev,
      daily_calories: calories,
      daily_protein: protein,
      daily_carbs: carbs,
      daily_fats: fats
    }));
  };

  const handleSave = async () => {
    try {
      await apiFetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      }, userUid);
      onComplete();
    } catch (err) {
      console.error("Failed to save profile", err);
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-background-light">
      <div className="w-full max-w-md bg-white flex flex-col min-h-screen relative shadow-2xl overflow-hidden">

        <div className="flex items-center p-4 pt-12 pb-2 justify-between">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} className="p-2 rounded-full hover:bg-slate-100">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-bold">Onboarding</h2>
          <div className="w-10" />
        </div>

        <div className="px-4 py-2">
          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-2">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h1 className="text-3xl font-extrabold">Let's get to know you</h1>
                <p className="text-slate-500">Please provide your details to personalize your macro goals.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alex Smith"
                      className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-bold mb-2">Age</label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
                        className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold mb-2">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary appearance-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-bold mb-2">Height (ft)</label>
                      <input
                        type="number"
                        value={formData.height_ft}
                        onChange={e => setFormData({ ...formData, height_ft: parseInt(e.target.value) })}
                        className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold mb-2">Height (in)</label>
                      <input
                        type="number"
                        value={formData.height_in}
                        onChange={e => setFormData({ ...formData, height_in: parseInt(e.target.value) })}
                        className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Weight (lbs)</label>
                    <input
                      type="number"
                      value={formData.weight_lbs}
                      onChange={e => setFormData({ ...formData, weight_lbs: parseInt(e.target.value) })}
                      className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h1 className="text-3xl font-extrabold">What's your goal?</h1>
                <p className="text-slate-500">Select a fitness goal to get personalized macro targets.</p>

                <div className="space-y-3">
                  {[
                    { id: 'lose_weight', label: 'Lose Weight', desc: 'Standard Cut (-500 kcal/day)', icon: <TrendingUp className="rotate-180" /> },
                    { id: 'aggressive_cut', label: 'Aggressive Cut', desc: 'Fast weight loss (-750 kcal/day)', icon: <TrendingUp className="rotate-180" /> },
                    { id: 'maintain', label: 'Maintain', desc: 'Keep current weight', icon: <Check /> },
                    { id: 'gain_muscle', label: 'Gain Muscle', desc: 'Lean Bulk (+300 kcal/day)', icon: <TrendingUp /> },
                    { id: 'dirty_bulk', label: 'Dirty Bulk', desc: 'Max mass gain (+500+ kcal/day)', icon: <TrendingUp /> },
                  ].map(goal => (
                    <button
                      key={goal.id}
                      onClick={() => setFormData({ ...formData, goal: goal.id })}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${formData.goal === goal.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/30'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.goal === goal.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {goal.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{goal.label}</p>
                        <p className="text-xs text-slate-500">{goal.desc}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.goal === goal.id ? 'border-primary' : 'border-slate-200'}`}>
                        {formData.goal === goal.id && <div className="w-3 h-3 rounded-full bg-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h1 className="text-3xl font-extrabold">Review Your Goals</h1>
                <p className="text-slate-500">Based on your input, here are your calculated targets.</p>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between focus-within:ring-2 focus-within:ring-primary transition-all">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-400 uppercase block cursor-text mb-1 flex items-center gap-1">
                        Daily Calories
                        <span className="text-slate-300 lowercase text-[10px]">(kcal)</span>
                      </label>
                      <input
                        type="number"
                        value={formData.daily_calories || ''}
                        onChange={e => setFormData({ ...formData, daily_calories: parseInt(e.target.value) || 0 })}
                        className="text-2xl font-extrabold bg-transparent border-none p-0 w-full focus:ring-0 text-slate-900"
                      />
                    </div>
                    <Settings className="text-slate-300" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl text-center focus-within:ring-2 focus-within:ring-primary transition-all">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Protein</label>
                      <input
                        type="number"
                        value={formData.daily_protein || ''}
                        onChange={e => setFormData({ ...formData, daily_protein: parseInt(e.target.value) || 0 })}
                        className="text-lg font-bold bg-transparent border-none p-0 w-full text-center focus:ring-0"
                      />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl text-center focus-within:ring-2 focus-within:ring-primary transition-all">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Carbs</label>
                      <input
                        type="number"
                        value={formData.daily_carbs || ''}
                        onChange={e => setFormData({ ...formData, daily_carbs: parseInt(e.target.value) || 0 })}
                        className="text-lg font-bold bg-transparent border-none p-0 w-full text-center focus:ring-0"
                      />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl text-center focus-within:ring-2 focus-within:ring-primary transition-all">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Fats</label>
                      <input
                        type="number"
                        value={formData.daily_fats || ''}
                        onChange={e => setFormData({ ...formData, daily_fats: parseInt(e.target.value) || 0 })}
                        className="text-lg font-bold bg-transparent border-none p-0 w-full text-center focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={() => {
              if (step < 3) {
                if (step === 2) calculateTargets();
                setStep(step + 1);
              } else {
                handleSave();
              }
            }}
            disabled={step === 1 && !formData.name}
            className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {step === 3 ? 'Start Tracking' : 'Continue'}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
