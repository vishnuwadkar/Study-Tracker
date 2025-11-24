import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Award,
  Save,
  X,
  BarChart3,
  Target,
  Zap,
  Moon,
  Sun,
  LogOut,
  LogIn,
  GraduationCap,
  Crown,
  BookOpen,
  PieChart,
  Hourglass,
  Trash2,
  Menu,
  Settings,
  Sliders
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  deleteDoc,
  getDoc
} from 'firebase/firestore';

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

// --- Constants & Data ---
const EXAM_DATE = new Date('2026-02-15');

// Subject Lists for different GATE Streams
const STREAM_SUBJECTS = {
  DA: [
    "Probability & Statistics", "Linear Algebra", "Calculus", "Prog, DS & Algo", 
    "Database Mgmt & Warehouse", "Machine Learning", "Artificial Intelligence", "General Aptitude"
  ],
  CS: [
    "Digital Logic", "COA", "Programming & DS", "Algorithms", "TOC", 
    "Compiler Design", "Operating Systems", "DBMS", "Computer Networks", 
    "Discrete Math", "Engineering Math", "General Aptitude"
  ],
  EC: [
    "Networks", "Signals & Systems", "Electronic Devices", "Analog Circuits", 
    "Digital Circuits", "Control Systems", "Communications", "Electromagnetics", 
    "Engineering Math", "General Aptitude"
  ],
  EE: [
    "Electric Circuits", "Electromagnetic Fields", "Signals & Systems", 
    "Electrical Machines", "Power Systems", "Control Systems", 
    "Electrical Measurements", "Analog & Digital Electronics", "Engineering Math"
  ],
  ME: [
    "Engg Mechanics", "Mechanics of Materials", "Theory of Machines", 
    "Vibrations", "Machine Design", "Fluid Mechanics", "Heat Transfer", 
    "Thermodynamics", "Manufacturing", "Engineering Math"
  ],
  CE: [
    "Engg Mechanics", "Solid Mechanics", "Structural Analysis", 
    "Construction Materials", "Geotechnical Engg", "Fluid Mechanics", 
    "Environmental Engg", "Transportation Engg", "Geomatics", "Engineering Math"
  ],
  Other: ["Subject 1", "Subject 2", "Subject 3", "General Aptitude"]
};

const STREAM_NAMES = {
  DA: "Data Science & AI",
  CS: "Computer Science",
  EC: "Electronics & Comm.",
  EE: "Electrical Engg.",
  ME: "Mechanical Engg.",
  CE: "Civil Engineering",
  Other: "General / Other"
};

// --- Helpers ---
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

const formatDateKey = (y, m, d) => {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

const App = () => {
  // --- State ---
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); 
  const [entries, setEntries] = useState({}); 
  
  // Settings State
  const [userSettings, setUserSettings] = useState({
    stream: 'DA',
    dailyTarget: 8
  });
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [inputHours, setInputHours] = useState('');
  const [inputMinutes, setInputMinutes] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [inputSubject, setInputSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Fetch Logs
  useEffect(() => {
    if (!user) return;
    const collRef = collection(db, 'artifacts', appId, 'users', user.uid, 'study_log');
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => { data[doc.id] = doc.data(); });
      setEntries(data);
    }, (error) => console.error("Error:", error));
    return () => unsubscribe();
  }, [user]);

  // Fetch User Settings
  useEffect(() => {
    if (!user) return;
    const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
    // Fetch once on load
    getDoc(settingsRef).then((snap) => {
        if (snap.exists()) {
            setUserSettings(snap.data());
        }
    }).catch(err => console.error("Error fetching settings", err));
  }, [user]);

  // Dark Mode Effect
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

  // --- Handlers ---
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } 
    catch (error) { alert(error.message); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); setEntries({}); setIsSettingsOpen(false); } 
    catch (error) { console.error(error); }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    try {
        const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
        await setDoc(settingsRef, userSettings);
        setIsSettingsOpen(false);
    } catch (err) {
        console.error("Settings save error", err);
    }
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day) => {
    const dateKey = formatDateKey(year, month, day);
    setSelectedDate(dateKey);
    
    // Reset inputs
    setInputHours('');
    setInputMinutes('');
    setInputNotes('');
    // Default to first subject of current stream
    setInputSubject(STREAM_SUBJECTS[userSettings.stream][0]);
    
    setIsModalOpen(true);
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    if (!user || !selectedDate) return;
    setIsLoading(true);

    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'study_log', selectedDate);
      const h = parseInt(inputHours || '0');
      const m = parseInt(inputMinutes || '0');
      const sessionHours = h + (m / 60);

      if (sessionHours > 0) {
        const currentEntry = entries[selectedDate] || {};
        let sessions = currentEntry.sessions || [];
        if (!currentEntry.sessions && currentEntry.hours) {
            sessions = [{
                id: 'legacy',
                subject: currentEntry.subject || 'Other',
                hours: currentEntry.hours,
                notes: currentEntry.notes || ''
            }];
        }

        const newSession = {
            id: Date.now().toString(),
            subject: inputSubject,
            hours: sessionHours,
            notes: inputNotes
        };
        const updatedSessions = [...sessions, newSession];
        const newTotalHours = updatedSessions.reduce((sum, s) => sum + s.hours, 0);

        await setDoc(docRef, {
          hours: newTotalHours,
          sessions: updatedSessions,
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

  const handleDeleteSession = async (sessionId) => {
    if (!user || !selectedDate) return;
    try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'study_log', selectedDate);
        const currentEntry = entries[selectedDate];
        const updatedSessions = currentEntry.sessions.filter(s => s.id !== sessionId);
        const newTotalHours = updatedSessions.reduce((sum, s) => sum + s.hours, 0);

        if (updatedSessions.length === 0) {
            await deleteDoc(docRef);
        } else {
            await setDoc(docRef, {
                ...currentEntry,
                hours: newTotalHours,
                sessions: updatedSessions,
                updatedAt: new Date().toISOString()
            });
        }
    } catch (err) {
        console.error("Delete error", err);
    }
  };

  // --- Helpers ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const stats = useMemo(() => {
    let monthlyTotal = 0;
    let daysStudied = 0;
    let daysTargetMet = 0;
    let streak = 0;
    const subjectTotals = {};
    let last7DaysTotal = 0;
    
    const target = userSettings.dailyTarget; // Use dynamic target

    for (let d = 1; d <= daysInMonth; d++) {
      const key = formatDateKey(year, month, d);
      const entry = entries[key];
      if (entry && entry.hours > 0) {
        monthlyTotal += entry.hours;
        daysStudied++;
        if (entry.hours >= target) daysTargetMet++;
        
        if (entry.sessions) {
            entry.sessions.forEach(s => {
                const sub = s.subject || "Other";
                subjectTotals[sub] = (subjectTotals[sub] || 0) + s.hours;
            });
        } else {
            const sub = entry.subject || "Other";
            subjectTotals[sub] = (subjectTotals[sub] || 0) + entry.hours;
        }
      }
    }

    const sortedSubjects = Object.entries(subjectTotals)
      .sort(([,a], [,b]) => b - a)
      .map(([name, hours]) => ({ 
        name, 
        hours, 
        percent: monthlyTotal > 0 ? (hours / monthlyTotal) * 100 : 0 
      }));

    const today = new Date();
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    let temp = new Date(today);
    
    for(let i=0; i<365; i++) {
        const k = formatDateKey(temp.getFullYear(), temp.getMonth(), temp.getDate());
        const entry = entries[k];
        const isToday = k === todayKey;
        
        if (entry && entry.hours >= target) {
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
        const hrs = entries[k]?.hours || 0;
        last7DaysTotal += hrs;
        weeklyData.push({
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            hours: hrs,
            isTarget: hrs >= target
        });
    }

    const examDiff = EXAM_DATE - new Date();
    const daysRemaining = Math.ceil(examDiff / (1000 * 60 * 60 * 24));

    return {
      monthlyTotal: monthlyTotal.toFixed(1),
      avgDaily: daysStudied > 0 ? (monthlyTotal / daysStudied).toFixed(1) : "0.0",
      completionRate: daysInMonth > 0 ? Math.round((daysTargetMet / new Date().getDate()) * 100) : 0,
      streak,
      weeklyData,
      last7DaysTotal: last7DaysTotal.toFixed(1),
      sortedSubjects,
      daysRemaining
    };
  }, [entries, year, month, daysInMonth, userSettings]); // Recalc when settings change

  const getCellColor = (hours) => {
    const target = userSettings.dailyTarget;
    if (!hours) return 'bg-white dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-zinc-200 dark:border-white/5';
    if (hours >= target) return 'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-600 dark:border-emerald-500/50 shadow-md shadow-emerald-200 dark:shadow-emerald-900/20'; 
    if (hours >= target / 2) return 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/50'; 
    return 'bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-white/5'; 
  };

  const getSelectedSessions = () => {
    if (!selectedDate || !entries[selectedDate]) return [];
    const entry = entries[selectedDate];
    if (entry.sessions) return entry.sessions;
    if (entry.hours > 0) return [{ id: 'legacy', subject: entry.subject || 'Other', hours: entry.hours, notes: entry.notes }];
    return [];
  };

  // --- RENDER: LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-3xl shadow-2xl dark:shadow-none backdrop-blur-xl border border-zinc-200 dark:border-white/10 max-w-md w-full text-center">
          <div className="bg-emerald-100 dark:bg-emerald-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-50 dark:ring-emerald-900/20">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">GATE<span className="text-emerald-600 dark:text-emerald-400">2026</span></h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">Master your preparation with precision analytics.</p>
          <button onClick={handleGoogleLogin} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg dark:shadow-white/10">
            <LogIn size={20} /> Sign in with Google
          </button>
          <div className="mt-8 flex justify-center gap-4">
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
             </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN ---
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300 selection:bg-emerald-500/30">
      
      {/* Top Navigation */}
      <nav className="bg-white/80 dark:bg-black/50 border-b border-zinc-200 dark:border-white/10 sticky top-0 z-30 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between relative">
            <div className="flex items-center gap-3 z-10">
                <div className="bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 dark:shadow-none">
                    <GraduationCap size={22} />
                </div>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                    GATE<span className="text-emerald-600 dark:text-emerald-400 ml-1">{userSettings.stream}</span>
                </h1>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest hidden sm:block">Target: {userSettings.dailyTarget}h Daily</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 z-10">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900/50 border border-transparent dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900/50 border border-transparent dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors" title="Settings">
                  <Menu size={20} />
                </button>
            </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Analytics */}
        <div className="space-y-6 lg:col-span-1 lg:sticky lg:top-28 lg:h-fit order-2 lg:order-1">
            
            {/* Countdown Card - Pulsing Hourglass */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 p-6 rounded-3xl shadow-xl shadow-indigo-500/20 dark:shadow-none text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border border-white/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-indigo-100 font-medium text-xs uppercase tracking-wider mb-1">Countdown to Exam</p>
                        <h3 className="text-4xl font-black tracking-tighter">{stats.daysRemaining} <span className="text-lg font-medium opacity-80">days left</span></h3>
                        <p className="text-xs text-indigo-200 mt-1">Feb 15, 2026</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md shadow-inner border border-white/20">
                        {/* COOL EFFECT: Pulse + Drop Shadow Glow */}
                        <Hourglass size={28} className="text-white animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    </div>
                </div>
            </div>

            {/* Streak Card */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10 relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 dark:bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                        <Zap size={18} fill="currentColor" className={stats.streak > 0 ? "animate-pulse" : ""} />
                        <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
                    </div>
                    <div className="text-5xl font-black text-zinc-900 dark:text-white tracking-tight">
                        {stats.streak}<span className="text-lg text-zinc-400 dark:text-zinc-500 font-medium ml-1">days</span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                        {stats.streak > 0 ? "You're on fire! 🔥" : "Start your streak today!"}
                    </p>
                </div>
            </div>
            
            {/* Mini Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-5 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10 transition-colors duration-300">
                    <Clock size={20} className="text-blue-500 mb-3" />
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.monthlyTotal}h</div>
                    <div className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Total Hours</div>
                </div>
                <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-5 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10 transition-colors duration-300">
                    <Target size={20} className="text-purple-500 mb-3" />
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.completionRate}%</div>
                    <div className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Completion</div>
                </div>
            </div>

            {/* Subject Breakdown */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-4">
                    <PieChart size={18} className="text-zinc-400" />
                    <h3 className="font-bold text-zinc-700 dark:text-zinc-200">Subject Breakdown</h3>
                </div>
                <div className="space-y-4">
                    {stats.sortedSubjects.length > 0 ? (
                        stats.sortedSubjects.slice(0, 5).map((sub) => (
                            <div key={sub.name}>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="font-medium text-zinc-600 dark:text-zinc-300 truncate pr-2">{sub.name}</span>
                                    <span className="text-zinc-400 font-mono">{formatDuration(sub.hours)}</span>
                                </div>
                                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out" 
                                        style={{ width: `${sub.percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4 text-xs text-zinc-400">No data yet. Start logging!</div>
                    )}
                </div>
            </div>

            {/* Weekly Chart */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10 transition-colors duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={18} className="text-zinc-400" />
                        <h3 className="font-bold text-zinc-700 dark:text-zinc-200">Last 7 Days</h3>
                    </div>
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                        Total: {stats.last7DaysTotal}h
                    </div>
                </div>
                <div className="flex items-end justify-between h-32 gap-2 mt-4">
                    {stats.weeklyData.map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 w-full h-full justify-end group">
                            <div className="w-full flex-1 relative bg-zinc-100 dark:bg-zinc-800 rounded-t-lg overflow-hidden">
                                <div 
                                    className={`absolute bottom-0 left-0 w-full rounded-t-lg transition-all duration-500 ${d.isTarget ? 'bg-emerald-500 dark:bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600 group-hover:bg-zinc-400 dark:group-hover:bg-zinc-500'}`}
                                    style={{ height: `${Math.min(100, (d.hours / userSettings.dailyTarget) * 100)}%` }}
                                ></div>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold pointer-events-none shadow-lg">
                                    {formatDuration(d.hours)}
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Column: Calendar */}
        <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
            <div className="bg-transparent rounded-3xl shadow-none transition-colors duration-300">
                <div className="p-6 bg-white dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-100 dark:border-white/5 flex items-center justify-between sticky top-[80px] z-20 rounded-t-3xl shadow-sm border-t border-x dark:border-white/10 transition-colors duration-300">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-baseline gap-2">
                            {monthNames[month]} <span className="text-zinc-300 dark:text-zinc-500 font-medium text-lg">{year}</span>
                        </h2>
                    </div>
                    <div className="flex gap-1 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-100 dark:border-white/5">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm rounded-lg text-zinc-500 dark:text-zinc-400 transition-all"><ChevronLeft size={20}/></button>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm rounded-lg text-zinc-500 dark:text-zinc-400 transition-all"><ChevronRight size={20}/></button>
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-zinc-900/50 backdrop-blur-xl rounded-b-3xl border-x border-b border-zinc-200 dark:border-white/10">
                    <div className="grid grid-cols-7 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-xs font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-wider">{d}</div>
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
                                        ${isToday ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-black' : ''}
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`text-sm font-bold ${hours >= userSettings.dailyTarget ? 'text-white/90' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`}>{day}</span>
                                        {hours >= userSettings.dailyTarget && <Crown size={20} className="text-yellow-300 fill-yellow-300 drop-shadow-md" />}
                                    </div>
                                    {hours > 0 ? (
                                        <div>
                                            <div className={`text-sm sm:text-lg font-bold ${hours >= userSettings.dailyTarget ? 'text-white' : 'text-zinc-700 dark:text-zinc-200'}`}>{formatDuration(hours)}</div>
                                            {entry.sessions && entry.sessions.length > 1 && (
                                                <div className="hidden sm:block text-[10px] text-zinc-400 dark:text-zinc-500">{entry.sessions.length} sessions</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-zinc-100 dark:bg-white/5 p-1.5 rounded-full"><TrendingUp size={14} className="text-zinc-400 dark:text-zinc-500"/></div>
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

      {/* Footer */}
      <footer className="py-10 text-center text-sm text-zinc-400 dark:text-zinc-600">
        <p>&copy; {new Date().getFullYear()} <span className="font-bold text-zinc-500 dark:text-zinc-500">@vishnuwadkar</span>. All rights reserved.</p>
      </footer>
      
      {/* Modal: Log Session */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/20 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl dark:shadow-2xl dark:shadow-black/50 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-zinc-200 dark:border-white/10">
            <div className="p-6 pb-0 flex justify-between items-center shrink-0">
                <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Log Session</h3>
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{selectedDate}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"><X size={18} /></button>
            </div>

            {/* Existing Sessions */}
            <div className="px-6 mt-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {getSelectedSessions().length > 0 && (
                    <div className="space-y-3 mb-6">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Today's Sessions</p>
                        {getSelectedSessions().map((s, idx) => (
                            <div key={s.id || idx} className="flex items-center justify-between bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl border border-zinc-100 dark:border-white/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-colors group">
                                <div>
                                    <div className="font-bold text-zinc-800 dark:text-zinc-100 text-base mb-0.5">{s.subject}</div>
                                    <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                                        <Clock size={12} className="text-emerald-500"/> {formatDuration(s.hours)} 
                                        {s.notes && <span className="opacity-60 font-normal">• {s.notes}</span>}
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteSession(s.id)} className="text-zinc-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <form onSubmit={handleSaveSession} className="p-6 pt-2 space-y-6 shrink-0">
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2"><BookOpen size={16} className="text-emerald-500"/> Add New Session</label>
                <div className="relative">
                    <select 
                        value={inputSubject}
                        onChange={(e) => setInputSubject(e.target.value)}
                        className="w-full appearance-none bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-4 text-zinc-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    >
                        {STREAM_SUBJECTS[userSettings.stream].map(s => <option key={s} value={s} className="dark:bg-zinc-900">{s}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400"><ChevronRight size={16} className="rotate-90"/></div>
                </div>
              </div>

              <div className="flex gap-4">
                    <div className="flex-1"><div className="relative"><input type="number" min="0" max="23" value={inputHours} onChange={(e) => setInputHours(e.target.value)} placeholder="0" className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-4 text-center text-2xl font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-all" /><span className="absolute right-4 top-5 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">Hr</span></div></div>
                    <div className="flex-1"><div className="relative"><input type="number" min="0" max="59" value={inputMinutes} onChange={(e) => setInputMinutes(e.target.value)} placeholder="0" className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-4 text-center text-2xl font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-all" /><span className="absolute right-4 top-5 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">Min</span></div></div>
              </div>
              
              <div>
                <textarea value={inputNotes} onChange={(e) => setInputNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-zinc-700 dark:text-zinc-200 text-sm placeholder:text-zinc-400" />
              </div>
              
              <button type="submit" disabled={isLoading} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-200 dark:shadow-none">{isLoading ? "Saving..." : <><Save size={18} /> Add Session</>}</button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal (Hamburger) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-end sm:justify-center p-4 sm:p-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full sm:w-96 rounded-3xl sm:rounded-[2rem] shadow-2xl p-6 border border-zinc-200 dark:border-white/10 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Settings size={20} className="text-emerald-500"/> Preferences
                    </h3>
                    <button onClick={() => setIsSettingsOpen(false)} className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"><X size={18} /></button>
                </div>

                <div className="space-y-6">
                    {/* Stream Selector */}
                    <div>
                        <label className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block">GATE Stream</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.keys(STREAM_NAMES).filter(k => k !== 'Other').map(key => (
                                <button
                                    key={key}
                                    onClick={() => setUserSettings({...userSettings, stream: key})}
                                    className={`p-3 rounded-xl text-sm font-bold transition-all border ${userSettings.stream === key ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-zinc-400 mt-2 text-center">{STREAM_NAMES[userSettings.stream]}</p>
                    </div>

                    {/* Target Slider */}
                    <div>
                        <label className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex justify-between">
                            Daily Goal 
                            <span className="text-emerald-500">{userSettings.dailyTarget} Hours</span>
                        </label>
                        <input 
                            type="range" 
                            min="1" max="16" step="1"
                            value={userSettings.dailyTarget}
                            onChange={(e) => setUserSettings({...userSettings, dailyTarget: parseInt(e.target.value)})}
                            className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-400 mt-2 font-mono">
                            <span>1h</span>
                            <span>8h</span>
                            <span>16h</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex gap-3">
                        <button onClick={handleLogout} className="flex-1 py-3.5 rounded-xl font-bold text-red-500 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2">
                            <LogOut size={18} /> Sign Out
                        </button>
                        <button onClick={handleSaveSettings} className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-zinc-900 dark:bg-emerald-600 hover:bg-zinc-800 dark:hover:bg-emerald-500 transition-all shadow-xl flex items-center justify-center gap-2">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;