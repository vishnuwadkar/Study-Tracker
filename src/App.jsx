import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Award,
  Save,
  X,
  BarChart3,
  Target,
  Zap,
  Moon,
  Sun
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  deleteDoc
} from 'firebase/firestore';

// --- Firebase Setup ---
// ⚠️ IMPORTANT: REPLACE THIS OBJECT WITH YOUR ACTUAL KEYS
const firebaseConfig = {
  apiKey: "AIzaSyAlQ7X1FIISCl8mRYnxdMXUXNmaDPnxQZA",
  authDomain: "studytracker-8b30c.firebaseapp.com",
  projectId: "studytracker-8b30c",
  storageBucket: "studytracker-8b30c.firebasestorage.app",
  messagingSenderId: "125314552038",
  appId: "1:125314552038:web:7e5f56edee8a4d45f5eb27",
  measurementId: "G-BHJH6PYS7F"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "my-study-tracker"; 

// --- Constants & Helpers ---
const TARGET_HOURS = 7;

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const formatDuration = (decimalHours) => {
  if (!decimalHours) return "0m";
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const App = () => {
  // --- State ---
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); 
  const [entries, setEntries] = useState({}); 
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputHours, setInputHours] = useState('');
  const [inputMinutes, setInputMinutes] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } 
      catch (err) { console.error("Auth failed", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const collRef = collection(db, 'artifacts', appId, 'users', user.uid, 'study_log');
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => { data[doc.id] = doc.data(); });
      setEntries(data);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // --- Date Helpers ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const formatDateKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // --- Interaction Handlers ---
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day) => {
    const dateKey = formatDateKey(year, month, day);
    setSelectedDate(dateKey);
    if (entries[dateKey]) {
      const totalH = entries[dateKey].hours;
      const h = Math.floor(totalH);
      const m = Math.round((totalH - h) * 60);
      setInputHours(h.toString());
      setInputMinutes(m === 0 ? '' : m.toString());
      setInputNotes(entries[dateKey].notes || '');
    } else {
      setInputHours('');
      setInputMinutes('');
      setInputNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !selectedDate) return;
    setIsLoading(true);

    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'study_log', selectedDate);
      const h = parseInt(inputHours || '0');
      const m = parseInt(inputMinutes || '0');
      const totalDecimalHours = h + (m / 60);
      
      if (totalDecimalHours === 0 && inputNotes.trim() === '') {
        if(entries[selectedDate]) await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          hours: totalDecimalHours,
          notes: inputNotes,
          updatedAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Analytics ---
  const stats = useMemo(() => {
    let monthlyTotal = 0;
    let daysStudied = 0;
    let daysTargetMet = 0;
    let streak = 0;
    
    for (let d = 1; d <= daysInMonth; d++) {
      const key = formatDateKey(year, month, d);
      const entry = entries[key];
      if (entry && entry.hours > 0) {
        monthlyTotal += entry.hours;
        daysStudied++;
        if (entry.hours >= TARGET_HOURS) daysTargetMet++;
      }
    }

    const today = new Date();
    let temp = new Date(today);
    for(let i=0; i<365; i++) {
        const k = formatDateKey(temp.getFullYear(), temp.getMonth(), temp.getDate());
        const entry = entries[k];
        const isToday = k === formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
        if (entry && entry.hours >= TARGET_HOURS) {
            streak++;
        } else if (!isToday) {
            break; 
        }
        temp.setDate(temp.getDate() - 1);
    }

    const weeklyData = [];
    const chartEnd = new Date();
    for(let i=6; i>=0; i--) {
        const d = new Date(chartEnd);
        d.setDate(d.getDate() - i);
        const k = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
        weeklyData.push({
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            hours: entries[k]?.hours || 0,
            isTarget: (entries[k]?.hours || 0) >= TARGET_HOURS
        });
    }

    return {
      monthlyTotal: monthlyTotal.toFixed(1),
      avgDaily: daysStudied > 0 ? (monthlyTotal / daysStudied).toFixed(1) : "0.0",
      completionRate: daysInMonth > 0 ? Math.round((daysTargetMet / new Date().getDate()) * 100) : 0,
      streak,
      weeklyData
    };
  }, [entries, year, month, daysInMonth]);

  const getCellColor = (hours) => {
    if (!hours) return 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700';
    if (hours >= TARGET_HOURS) return 'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-600 dark:border-emerald-500 shadow-md shadow-emerald-200 dark:shadow-emerald-900/20'; 
    if (hours >= TARGET_HOURS / 2) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800'; 
    return 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'; 
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 transition-colors duration-200 backdrop-blur-md bg-white/90 dark:bg-slate-800/90 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
                    <TrendingUp size={22} />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">GATE<span className="text-emerald-600 dark:text-emerald-400">2026</span></h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily Target: {TARGET_HOURS}h</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                    <span className="text-xs font-semibold px-3 py-1 bg-white dark:bg-slate-600 rounded-md shadow-sm text-slate-700 dark:text-slate-200">Month</span>
                </div>
            </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Analytics Dashboard */}
        {/* On Mobile: Order 2 (Bottom). On Desktop: Order 1 (Left/Top) */}
        <div className="space-y-6 lg:col-span-1 lg:sticky lg:top-28 lg:h-fit order-2 lg:order-1">
            
            {/* Streak Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden transition-colors duration-200">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                        <Zap size={18} fill="currentColor" />
                        <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
                    </div>
                    <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        {stats.streak}<span className="text-lg text-slate-400 dark:text-slate-500 font-medium ml-1">days</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Keep showing up every day!</p>
                </div>
            </div>

            {/* Mini Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
                    <Clock size={20} className="text-blue-500 mb-3" />
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.monthlyTotal}h</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">Total Hours</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
                    <Target size={20} className="text-purple-500 mb-3" />
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completionRate}%</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">Completion</div>
                </div>
            </div>

            {/* Weekly Activity Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 size={18} className="text-slate-400" />
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">Last 7 Days</h3>
                </div>
                <div className="flex items-end justify-between h-32 gap-2">
                    {stats.weeklyData.map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 w-full">
                            <div className="w-full relative flex items-end justify-center group h-full">
                                <div 
                                    className={`w-full rounded-t-lg transition-all duration-500 ${d.isTarget ? 'bg-emerald-500 dark:bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'}`}
                                    style={{ height: `${Math.min(100, (d.hours / TARGET_HOURS) * 100)}%` }}
                                ></div>
                                {/* Tooltip */}
                                <div className="absolute -top-8 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                                    {formatDuration(d.hours)}
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Column: Calendar */}
        {/* On Mobile: Order 1 (Top). On Desktop: Order 2 (Right) */}
        <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
            
            {/* Calendar Container - Removed overflow-hidden to let header stick properly */}
            <div className="bg-transparent rounded-3xl shadow-sm transition-colors duration-200">
                
                {/* Calendar Header - Sticky */}
                <div className="p-6 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between sticky top-[76px] z-20 rounded-t-3xl shadow-sm transition-colors duration-200">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
                            {monthNames[month]} <span className="text-slate-300 dark:text-slate-500 font-medium text-lg">{year}</span>
                        </h2>
                    </div>
                    <div className="flex gap-1 bg-slate-50 dark:bg-slate-700 p-1 rounded-xl">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm rounded-lg text-slate-500 dark:text-slate-300 transition-all"><ChevronLeft size={20}/></button>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm rounded-lg text-slate-500 dark:text-slate-300 transition-all"><ChevronRight size={20}/></button>
                    </div>
                </div>

                {/* Calendar Grid - Background color applied here */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-b-3xl">
                    <div className="grid grid-cols-7 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-xs font-bold text-slate-300 dark:text-slate-600 uppercase tracking-wider">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-fr gap-2 sm:gap-4">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                        
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateKey = formatDateKey(year, month, day);
                            const entry = entries[dateKey];
                            const hours = entry?.hours || 0;
                            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                            return (
                                <div 
                                    key={day}
                                    onClick={() => handleDayClick(day)}
                                    className={`
                                        relative aspect-square sm:aspect-[4/3] rounded-2xl p-2 sm:p-3 transition-all cursor-pointer border
                                        flex flex-col justify-between group
                                        ${getCellColor(hours)}
                                        ${isToday ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-800' : ''}
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`text-sm font-bold ${hours >= TARGET_HOURS ? 'text-white/90' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>{day}</span>
                                        {hours >= TARGET_HOURS && <CheckCircle2 size={16} className="text-white" />}
                                    </div>
                                    
                                    {hours > 0 ? (
                                        <div>
                                            <div className={`text-sm sm:text-lg font-bold ${hours >= TARGET_HOURS ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {formatDuration(hours)}
                                            </div>
                                            {entry.notes && <div className={`hidden sm:block text-[10px] truncate ${hours >= TARGET_HOURS ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>{entry.notes}</div>}
                                        </div>
                                    ) : (
                                        <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-slate-900/10 dark:bg-white/10 p-1.5 rounded-full"><TrendingUp size={14} className="text-slate-400 dark:text-slate-500"/></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

      </main>

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 dark:bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 pb-0 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Log Session</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{selectedDate}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              
              {/* Time Inputs */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-emerald-500" /> Time Studied
                </label>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="number" min="0" max="23"
                                value={inputHours} onChange={(e) => setInputHours(e.target.value)}
                                placeholder="0"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-4 text-center text-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                autoFocus
                            />
                            <span className="absolute right-4 top-5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Hr</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="number" min="0" max="59"
                                value={inputMinutes} onChange={(e) => setInputMinutes(e.target.value)}
                                placeholder="0"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-4 text-center text-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            />
                            <span className="absolute right-4 top-5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Min</span>
                        </div>
                    </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                <textarea
                  value={inputNotes} onChange={(e) => setInputNotes(e.target.value)}
                  placeholder="What did you achieve?"
                  rows={3}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-slate-700 dark:text-slate-200 text-sm"
                />
              </div>

              {/* Footer */}
              <button
                type="submit" disabled={isLoading}
                className="w-full bg-slate-900 dark:bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 dark:shadow-none"
              >
                {isLoading ? "Saving..." : <><Save size={18} /> Save Progress</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;