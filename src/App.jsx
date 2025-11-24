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
  Sliders,
  CheckSquare,
  RefreshCw,
  LayoutDashboard,
  ListChecks,
  Timer,
  Play,
  Pause,
  Square,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Lightbulb
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

// --- Constants & Helpers ---
const TARGET_HOURS = 8;
const EXAM_DATE = new Date('2026-02-15');

// Detailed Syllabus Data with WEIGHTAGE (Approximate marks)
const SYLLABUS_DATA = {
  DA: {
    "Probability & Statistics": {
        weight: 15,
        topics: ["Counting", "Probability Axioms", "Conditional Probability", "Random Variables", "Discrete & Continuous Distributions", "Poisson, Normal, Exponential", "Mean, Median, Mode", "Standard Deviation", "Correlation", "Sampling", "Hypothesis Testing"]
    },
    "Linear Algebra": {
        weight: 10,
        topics: ["Vector Spaces", "Subspaces", "Linear Dependence", "Matrices & Determinants", "Eigenvalues & Eigenvectors", "Matrix Decompositions", "Projection Matrix"]
    },
    "Calculus": {
        weight: 8,
        topics: ["Limits & Continuity", "Differentiation", "Maxima & Minima", "Integration", "Sequences & Series", "Taylor Series"]
    },
    "Prog, DS & Algo": {
        weight: 12,
        topics: ["Python Programming", "Stacks & Queues", "Linked Lists", "Trees (BST, AVL)", "Graph Traversal", "Sorting & Searching", "Hashing", "Time Complexity"]
    },
    "Database Mgmt": {
        weight: 10,
        topics: ["ER Models", "Relational Model", "Normalization", "SQL Queries", "Transactions", "Data Warehousing", "Schema Design"]
    },
    "Machine Learning": {
        weight: 15,
        topics: ["Supervised Learning", "Unsupervised Learning", "Decision Trees", "SVM", "Neural Networks", "Model Evaluation", "Overfitting"]
    },
    "Artificial Intelligence": {
        weight: 10,
        topics: ["Search Algorithms", "Logic", "Reasoning under Uncertainty", "Planning"]
    },
    "General Aptitude": {
        weight: 15,
        topics: ["Verbal Ability", "Quantitative Aptitude", "Analytical Aptitude", "Spatial Aptitude"]
    },
    "Other": { weight: 5, topics: ["Misc Topics"] }
  },
  CS: {
    "Digital Logic": { weight: 5, topics: ["Boolean Algebra", "Combinational Circuits", "Sequential Circuits", "Number Rep", "Computer Arithmetic"] },
    "COA": { weight: 8, topics: ["Machine Instructions", "Addressing Modes", "ALU", "Pipelining", "Memory Hierarchy", "I/O"] },
    "Programming & DS": { weight: 12, topics: ["C Programming", "Recursion", "Arrays", "Stacks", "Queues", "Linked Lists", "Trees", "Graphs"] },
    "Algorithms": { weight: 10, topics: ["Asymptotic Analysis", "Divide & Conquer", "Greedy", "Dynamic Programming", "Graph Algo", "NP-Completeness"] },
    "TOC": { weight: 8, topics: ["Regular Expressions", "Finite Automata", "Context-Free Grammars", "Turing Machines", "Undecidability"] },
    "Compiler Design": { weight: 6, topics: ["Lexical Analysis", "Parsing", "Syntax Directed Translation", "Runtime Env"] },
    "Operating Systems": { weight: 10, topics: ["Processes", "Threads", "CPU Scheduling", "Synchronization", "Deadlock", "Memory Mgmt", "File Systems"] },
    "DBMS": { weight: 8, topics: ["ER Model", "Relational Algebra", "SQL", "Normalization", "Transactions", "Concurrency"] },
    "Computer Networks": { weight: 8, topics: ["OSI/TCP-IP", "IP Addressing", "Routing", "TCP/UDP", "App Layer"] },
    "General Aptitude": { weight: 15, topics: ["Verbal", "Quant", "Analytical"] },
    "Engineering Math": { weight: 10, topics: ["Linear Algebra", "Calculus", "Probability", "Discrete Math"] }
  }
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

// Format timer seconds to HH:MM:SS
const formatTimer = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const App = () => {
  // --- State ---
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); 
  const [entries, setEntries] = useState({}); 
  const [syllabusProgress, setSyllabusProgress] = useState({});
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'syllabus' | 'timer'
  
  // Settings State
  const [userSettings, setUserSettings] = useState({
    stream: 'DA',
    dailyTarget: 8
  });
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState({});
  
  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null); // For accurate background timing
  const [timerSubject, setTimerSubject] = useState('');
  const [isZenMode, setIsZenMode] = useState(false);
  const [wakeLock, setWakeLock] = useState(null); // Store wake lock reference

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

  // --- Effects ---
  
  // IMPROVED Timer Logic: Background Safe + Title Update
  useEffect(() => {
    let interval = null;
    
    if (isTimerRunning && startTime) {
      // Update immediate UI
      const diff = Math.floor((Date.now() - startTime) / 1000);
      setTimerSeconds(diff);
      document.title = `${formatTimer(diff)} - Focus`; // Show time in tab

      interval = setInterval(() => {
        const now = Date.now();
        const currentDiff = Math.floor((now - startTime) / 1000);
        setTimerSeconds(currentDiff);
        document.title = `${formatTimer(currentDiff)} - Focus`;
      }, 1000);
    } else {
        document.title = "GATE 2026 Tracker";
    }

    return () => {
        clearInterval(interval);
        document.title = "GATE 2026 Tracker";
    };
  }, [isTimerRunning, startTime]);

  // Screen Wake Lock Logic
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
      } catch (err) {
        console.log(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
    }
  };

  // Auth & Data Fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const logsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'study_log');
    const unsubLogs = onSnapshot(logsRef, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => { data[doc.id] = doc.data(); });
      setEntries(data);
    }, (error) => console.error("Error:", error));

    const sylRef = doc(db, 'artifacts', appId, 'users', user.uid, 'syllabus', 'progress');
    const unsubSyl = onSnapshot(sylRef, (doc) => {
        if (doc.exists()) setSyllabusProgress(doc.data());
    });

    const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
    getDoc(settingsRef).then((snap) => {
        if (snap.exists()) {
            const data = snap.data();
            setUserSettings(data);
            // Initialize timer subject if empty
            if (data.stream && SYLLABUS_DATA[data.stream]) {
                setTimerSubject(Object.keys(SYLLABUS_DATA[data.stream])[0]);
            }
        }
    });

    return () => { unsubLogs(); unsubSyl(); };
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

  // Initialize timer subject on load if not set
  useEffect(() => {
    if (!timerSubject && userSettings.stream && SYLLABUS_DATA[userSettings.stream]) {
        setTimerSubject(Object.keys(SYLLABUS_DATA[userSettings.stream])[0]);
    }
  }, [userSettings.stream, timerSubject]);

  // --- Handlers ---
  
  // Handle Timer Start (with background check)
  const handleStartTimer = () => {
    const newStart = Date.now() - (timerSeconds * 1000);
    setStartTime(newStart);
    setIsTimerRunning(true);
    requestWakeLock(); // Keep screen on
  };

  // Handle Timer Pause
  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    releaseWakeLock(); // Let screen sleep
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } 
    catch (error) { alert(error.message); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); setEntries({}); setSyllabusProgress({}); setIsSettingsOpen(false); } 
    catch (error) { console.error(error); }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    try {
        const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
        await setDoc(settingsRef, userSettings);
        setIsSettingsOpen(false);
    } catch (err) { console.error(err); }
  };

  const toggleSyllabusItem = async (subject, topic, field) => {
    if (!user) return;
    const newProgress = { ...syllabusProgress };
    if (!newProgress[subject]) newProgress[subject] = {};
    if (!newProgress[subject][topic]) newProgress[subject][topic] = { done: false, rev: 0 };

    if (field === 'done') {
        newProgress[subject][topic].done = !newProgress[subject][topic].done;
    } else if (field === 'rev_inc') {
        newProgress[subject][topic].rev = (newProgress[subject][topic].rev || 0) + 1;
    } else if (field === 'rev_dec') {
        newProgress[subject][topic].rev = Math.max(0, (newProgress[subject][topic].rev || 0) - 1);
    }

    setSyllabusProgress(newProgress);
    try {
        const sylRef = doc(db, 'artifacts', appId, 'users', user.uid, 'syllabus', 'progress');
        await setDoc(sylRef, newProgress);
    } catch (err) { console.error(err); }
  };

  const toggleSubjectExpand = (subject) => {
    setExpandedSubjects(prev => ({...prev, [subject]: !prev[subject]}));
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day) => {
    const dateKey = formatDateKey(year, month, day);
    setSelectedDate(dateKey);
    setInputHours('');
    setInputMinutes('');
    setInputNotes('');
    const subjects = Object.keys(SYLLABUS_DATA[userSettings.stream] || {});
    setInputSubject(subjects[0] || 'Other');
    setIsModalOpen(true);
  };

  const handleTimerFinish = () => {
    setIsTimerRunning(false);
    setIsZenMode(false);
    releaseWakeLock();
    
    const h = Math.floor(timerSeconds / 3600);
    const m = Math.round((timerSeconds % 3600) / 60);
    
    const today = new Date();
    const dateKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    
    setSelectedDate(dateKey);
    setInputHours(h.toString());
    setInputMinutes(m.toString());
    setInputSubject(timerSubject);
    setInputNotes('Logged via Focus Timer');
    
    setTimerSeconds(0);
    setStartTime(null);
    setIsModalOpen(true);
    setActiveView('dashboard'); 
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
            sessions = [{ id: 'legacy', subject: currentEntry.subject || 'Other', hours: currentEntry.hours, notes: currentEntry.notes || '' }];
        }

        const newSession = { id: Date.now().toString(), subject: inputSubject, hours: sessionHours, notes: inputNotes };
        const updatedSessions = [...sessions, newSession];
        const newTotalHours = updatedSessions.reduce((sum, s) => sum + s.hours, 0);

        await setDoc(docRef, {
          hours: newTotalHours,
          sessions: updatedSessions,
          updatedAt: new Date().toISOString()
        });
      }
      setInputHours('');
      setInputMinutes('');
      setInputNotes('');
      setIsLoading(false);
    } catch (err) { console.error(err); setIsLoading(false); }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!user || !selectedDate) return;
    try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'study_log', selectedDate);
        const currentEntry = entries[selectedDate];
        const updatedSessions = currentEntry.sessions.filter(s => s.id !== sessionId);
        const newTotalHours = updatedSessions.reduce((sum, s) => sum + s.hours, 0);

        if (updatedSessions.length === 0) await deleteDoc(docRef);
        else await setDoc(docRef, { ...currentEntry, hours: newTotalHours, sessions: updatedSessions, updatedAt: new Date().toISOString() });
    } catch (err) { console.error(err); }
  };

  // --- Analytics ---
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
    const target = userSettings.dailyTarget;

    for (let d = 1; d <= daysInMonth; d++) {
      const key = formatDateKey(year, month, d);
      const entry = entries[key];
      if (entry && entry.hours > 0) {
        monthlyTotal += entry.hours;
        daysStudied++;
        if (entry.hours >= target) daysTargetMet++;
        if (entry.sessions) {
            entry.sessions.forEach(s => { const sub = s.subject || "Other"; subjectTotals[sub] = (subjectTotals[sub] || 0) + s.hours; });
        } else {
            const sub = entry.subject || "Other";
            subjectTotals[sub] = (subjectTotals[sub] || 0) + entry.hours;
        }
      }
    }

    const sortedSubjects = Object.entries(subjectTotals).sort(([,a], [,b]) => b - a).map(([name, hours]) => ({ name, hours, percent: monthlyTotal > 0 ? (hours / monthlyTotal) * 100 : 0 }));

    const today = new Date();
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    let temp = new Date(today);
    for(let i=0; i<365; i++) {
        const k = formatDateKey(temp.getFullYear(), temp.getMonth(), temp.getDate());
        const entry = entries[k];
        const isToday = k === todayKey;
        if (entry && entry.hours >= target) streak++;
        else if (!isToday) break; 
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
        weeklyData.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), hours: hrs, isTarget: hrs >= target });
    }

    const examDiff = EXAM_DATE - new Date();
    const daysRemaining = Math.ceil(examDiff / (1000 * 60 * 60 * 24));

    let totalWeightedScore = 0;
    let achievedWeightedScore = 0;
    let totalRevisions = 0;
    const streamData = SYLLABUS_DATA[userSettings.stream] || {};
    Object.entries(streamData).forEach(([subject, data]) => {
        const weight = data.weight || 0;
        const topics = data.topics || [];
        const topicWeight = weight / (topics.length || 1);
        totalWeightedScore += weight;
        topics.forEach(topic => {
            const prog = syllabusProgress[subject]?.[topic];
            if (prog?.done) achievedWeightedScore += topicWeight;
            if (prog?.rev) totalRevisions += prog.rev;
        });
    });
    const syllabusCompletion = totalWeightedScore > 0 ? Math.round((achievedWeightedScore / totalWeightedScore) * 100) : 0;

    return { monthlyTotal: monthlyTotal.toFixed(1), avgDaily: daysStudied > 0 ? (monthlyTotal / daysStudied).toFixed(1) : "0.0", completionRate: daysInMonth > 0 ? Math.round((daysTargetMet / new Date().getDate()) * 100) : 0, streak, weeklyData, last7DaysTotal: last7DaysTotal.toFixed(1), sortedSubjects, daysRemaining, syllabusCompletion, totalRevisions };
  }, [entries, year, month, daysInMonth, userSettings, syllabusProgress]);

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

  const activeStreamSubjects = SYLLABUS_DATA[userSettings.stream] || {};

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-3xl shadow-2xl dark:shadow-none backdrop-blur-xl border border-zinc-200 dark:border-white/10 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] animate-pulse-slow pointer-events-none"></div>
          <div className="bg-emerald-100 dark:bg-emerald-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-50 dark:ring-emerald-900/20 relative z-10">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight relative z-10">GATE<span className="text-emerald-600 dark:text-emerald-400">2026</span></h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 relative z-10">Master your preparation with precision analytics.</p>
          <button onClick={handleGoogleLogin} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg dark:shadow-white/10 relative z-10">
            <LogIn size={20} /> Sign in with Google
          </button>
          <div className="mt-8 flex justify-center gap-4 relative z-10">
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300 selection:bg-emerald-500/30 ${isTimerRunning && isZenMode ? 'overflow-hidden' : ''}`}>
      
      {/* Top Navigation (Hidden in Zen Mode) */}
      {(!isTimerRunning || !isZenMode) && (
        <nav className="bg-white/80 dark:bg-black/50 border-b border-zinc-200 dark:border-white/10 sticky top-0 z-30 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/50 transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
                {/* Left: Logo + Title + Focus Button */}
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 dark:shadow-none">
                        <GraduationCap size={22} />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">
                            GATE <span className="text-emerald-600 dark:text-emerald-400">2026</span>
                        </h1>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest">{userSettings.stream}</p>
                    </div>
                    
                    <button 
                        onClick={() => setActiveView('timer')}
                        className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${activeView === 'timer' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'}`}
                    >
                        <Timer size={16} className={activeView === 'timer' ? 'animate-pulse' : ''}/>
                        <span className="hidden sm:inline">Focus Mode</span>
                    </button>
                </div>

                {/* Center: View Toggles */}
                <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200 dark:border-white/10">
                    <button onClick={() => setActiveView('dashboard')} className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'dashboard' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
                        <LayoutDashboard size={14} /> <span className="hidden sm:inline">Tracker</span>
                    </button>
                    <button onClick={() => setActiveView('syllabus')} className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'syllabus' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
                        <ListChecks size={14} /> <span className="hidden sm:inline">Syllabus</span>
                    </button>
                </div>

                {/* Right: Settings */}
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900/50 border border-transparent dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900/50 border border-transparent dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors" title="Settings">
                    <Menu size={20} />
                    </button>
                </div>
            </div>
        </nav>
      )}

      <main className={`max-w-6xl mx-auto p-4 sm:p-6 ${isTimerRunning && isZenMode ? 'h-screen flex items-center justify-center p-0 m-0 max-w-none' : ''}`}>
        {activeView === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Analytics */}
                <div className="space-y-6 lg:col-span-1 lg:sticky lg:top-28 lg:h-fit order-2 lg:order-1">
                    {/* Countdown Card */}
                    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 p-6 rounded-3xl shadow-xl shadow-indigo-500/20 dark:shadow-none text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border border-white/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl animate-pulse-slow"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-indigo-100 font-medium text-xs uppercase tracking-wider mb-1">Countdown to Exam</p>
                                <h3 className="text-4xl font-black tracking-tighter">{stats.daysRemaining} <span className="text-lg font-medium opacity-80">days left</span></h3>
                                <p className="text-xs text-indigo-200 mt-1">Feb 15, 2026</p>
                            </div>
                            <div className="bg-amber-400/20 p-4 rounded-2xl backdrop-blur-md border border-amber-300/30 shadow-[0_0_30px_rgba(251,191,36,0.3)] animate-pulse-slow">
                                <Hourglass size={28} className="text-amber-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" />
                            </div>
                        </div>
                    </div>

                    {/* Syllabus Coverage Card */}
                    <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10 transition-colors duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <ListChecks size={18} className="text-zinc-400" />
                                <h3 className="font-bold text-zinc-700 dark:text-zinc-200">Syllabus Weighted</h3>
                            </div>
                            <span className="text-xs font-bold bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded-md">{stats.syllabusCompletion}%</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-white/5 rounded-full h-2 mb-4">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: `${stats.syllabusCompletion}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                            <span>Total Revisions</span>
                            <span className="font-bold text-zinc-700 dark:text-white">{stats.totalRevisions}</span>
                        </div>
                    </div>

                    {/* Streak Card */}
                    <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10 relative overflow-hidden transition-colors duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 dark:bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-3xl animate-pulse-slow"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                                <Zap size={18} fill="currentColor" className={stats.streak > 0 ? "animate-pulse" : ""} />
                                <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
                            </div>
                            <div className="text-5xl font-black text-zinc-900 dark:text-white tracking-tight">
                                {stats.streak}<span className="text-lg text-zinc-400 dark:text-zinc-500 font-medium ml-1">days</span>
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">{stats.streak > 0 ? "You're on fire! 🔥" : "Start your streak today!"}</p>
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

                    {/* Weekly Chart */}
                    <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10 transition-colors duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={18} className="text-zinc-400" />
                                <h3 className="font-bold text-zinc-700 dark:text-zinc-200">Last 7 Days</h3>
                            </div>
                            <div className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">Total: {stats.last7DaysTotal}h</div>
                        </div>
                        <div className="flex items-end justify-between h-32 gap-2 mt-4">
                            {stats.weeklyData.map((d, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 w-full h-full justify-end group">
                                    <div className="w-full flex-1 relative bg-zinc-100 dark:bg-zinc-800 rounded-t-lg overflow-hidden">
                                        <div className={`absolute bottom-0 left-0 w-full rounded-t-lg transition-all duration-500 ${d.isTarget ? 'bg-emerald-500 dark:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-zinc-300 dark:bg-zinc-600 group-hover:bg-zinc-400 dark:group-hover:bg-zinc-500'}`} style={{ height: `${Math.min(100, (d.hours / userSettings.dailyTarget) * 100)}%` }}></div>
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
                                    const metTarget = hours >= userSettings.dailyTarget;
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
                                                <span className={`text-sm font-bold ${metTarget ? 'text-white/90' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`}>{day}</span>
                                                {metTarget && <Crown size={20} className="text-yellow-300 fill-yellow-300 drop-shadow-md animate-pulse-slow" />}
                                            </div>
                                            {hours > 0 ? (
                                                <div>
                                                    <div className={`text-sm sm:text-lg font-bold ${metTarget ? 'text-white' : 'text-zinc-700 dark:text-zinc-200'}`}>{formatDuration(hours)}</div>
                                                    {entry.sessions && entry.sessions.length > 1 && (
                                                        <div className={`hidden sm:block text-[10px] truncate ${metTarget ? 'text-white/80' : 'text-zinc-400 dark:text-zinc-500'}`}>{entry.sessions.length} sessions</div>
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
            </div>
        )}

        {/* TIMER VIEW */}
        {activeView === 'timer' && (
            <div className={`w-full h-full flex flex-col justify-center items-center relative transition-all duration-500 ${isZenMode ? 'scale-110' : ''}`}>
                {/* Background Zen Glow */}
                <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/10 blur-[120px] rounded-full -z-10 animate-pulse-slow"></div>
                
                <div className={`w-full max-w-2xl bg-white dark:bg-black/40 backdrop-blur-2xl p-8 md:p-12 rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-white/5 text-center relative overflow-hidden transition-all duration-500 ${isZenMode ? 'border-none shadow-none bg-transparent' : ''}`}>
                    
                    {!isZenMode && (
                        <div className="mb-8">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Focus Session</label>
                            <div className="relative inline-block w-full max-w-xs">
                                <select 
                                    value={timerSubject} 
                                    onChange={(e) => setTimerSubject(e.target.value)}
                                    className="w-full appearance-none bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 px-6 text-zinc-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center cursor-pointer"
                                    disabled={isTimerRunning}
                                >
                                    {Object.keys(activeStreamSubjects).map(s => <option key={s} value={s} className="dark:bg-zinc-900">{s}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    <div className={`font-black font-mono text-zinc-900 dark:text-white tracking-tighter mb-12 tabular-nums transition-all duration-500 ${isZenMode ? 'text-[12rem] md:text-[16rem] drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'text-7xl md:text-9xl'}`}>
                        {formatTimer(timerSeconds)}
                    </div>

                    {/* Zen Mode Toggle (Only visible when timer running) */}
                    {isTimerRunning && (
                        <button 
                            onClick={() => setIsZenMode(!isZenMode)}
                            className="absolute top-6 right-6 p-3 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-400 hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-all z-20"
                            title="Toggle Zen Mode"
                        >
                            {isZenMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                    )}

                    <div className="flex items-center justify-center gap-6 relative z-10">
                        {!isTimerRunning ? (
                            <button 
                                onClick={handleStartTimer}
                                className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-110 hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] transition-all duration-300"
                            >
                                <Play size={36} fill="currentColor" className="ml-1" />
                                <span className="absolute -bottom-10 text-xs font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">START</span>
                            </button>
                        ) : (
                            <button 
                                onClick={handlePauseTimer}
                                className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-amber-500 text-white shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:scale-110 hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] transition-all duration-300"
                            >
                                <Pause size={36} fill="currentColor" />
                                <span className="absolute -bottom-10 text-xs font-bold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">PAUSE</span>
                            </button>
                        )}

                        <button 
                            onClick={handleTimerFinish}
                            disabled={timerSeconds === 0}
                            className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-zinc-200 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-zinc-200 disabled:hover:text-zinc-600"
                        >
                            <Square size={28} fill="currentColor" />
                            <span className="absolute -bottom-10 text-xs font-bold text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">FINISH</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {activeView === 'syllabus' && (
            /* SYLLABUS VIEW */
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Syllabus Tracker</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Weighted tracking of topic completion and revisions.</p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Weighted Progress</p>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.syllabusCompletion}%</div>
                    </div>
                </div>

                <div className="space-y-6">
                    {Object.entries(activeStreamSubjects).map(([subject, data]) => {
                        const topics = data.topics || [];
                        const weight = data.weight || 0;
                        const isExpanded = expandedSubjects[subject];
                        // Calc weighted progress for this subject
                        const totalSubWeight = weight;
                        const weightPerTopic = totalSubWeight / (topics.length || 1);
                        let earnedWeight = 0;
                        topics.forEach(t => { if (syllabusProgress[subject]?.[t]?.done) earnedWeight += weightPerTopic; });
                        const percent = totalSubWeight > 0 ? Math.round((earnedWeight/totalSubWeight)*100) : 0;

                        return (
                            <div key={subject} className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10 overflow-hidden transition-all duration-300">
                                <div 
                                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                                    onClick={() => toggleSubjectExpand(subject)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{subject}</h3>
                                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400">Weight: {weight}%</span>
                                            </div>
                                            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">{percent}% Done</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                                            <div className={`h-2 rounded-full transition-all duration-500 ${percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="ml-6 text-zinc-400">
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 p-4 space-y-2">
                                        {topics.map(topic => {
                                            const tData = syllabusProgress[subject]?.[topic] || { done: false, rev: 0 };
                                            return (
                                                <div key={topic} className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors group">
                                                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleSyllabusItem(subject, topic, 'done')}>
                                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${tData.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600 text-transparent group-hover:border-emerald-400'}`}>
                                                            <CheckSquare size={14} fill="currentColor" />
                                                        </div>
                                                        <span className={`text-sm font-medium transition-colors ${tData.done ? 'text-zinc-400 line-through decoration-zinc-400/50' : 'text-zinc-700 dark:text-zinc-200'}`}>{topic}</span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3 pl-4 border-l border-zinc-200 dark:border-white/10 ml-4">
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Rev</span>
                                                        <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-lg p-1 border border-zinc-200 dark:border-white/10">
                                                            <button onClick={() => toggleSyllabusItem(subject, topic, 'rev_dec')} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-30" disabled={!tData.rev}>
                                                                <ChevronLeft size={14} />
                                                            </button>
                                                            <span className="w-6 text-center text-xs font-bold text-zinc-700 dark:text-zinc-200">{tData.rev || 0}</span>
                                                            <button onClick={() => toggleSyllabusItem(subject, topic, 'rev_inc')} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                                                <RefreshCw size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </main>

      {/* Footer (Hidden in Zen Mode) */}
      {(!isTimerRunning || !isZenMode) && (
        <footer className="py-10 text-center text-sm text-zinc-400 dark:text-zinc-600">
            <p>&copy; {new Date().getFullYear()} <span className="font-bold text-zinc-500 dark:text-zinc-500">@vishnuwadkar</span>. All rights reserved.</p>
        </footer>
      )}
      
      {/* Modal: Log Session (Split Screen V7) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/20 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl dark:shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-white/10 flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Left Column: History List */}
            <div className="w-full md:w-1/2 bg-zinc-50/50 dark:bg-black/20 p-6 md:p-8 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-white/5 flex flex-col h-[200px] md:h-auto order-2 md:order-1">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock size={14}/> Today's History
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {getSelectedSessions().length > 0 ? (
                        getSelectedSessions().map((s, idx) => (
                            <div key={s.id || idx} className="flex items-center justify-between bg-white dark:bg-white/5 p-4 rounded-2xl border border-zinc-100 dark:border-white/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all group shadow-sm">
                                <div>
                                    <div className="font-bold text-zinc-800 dark:text-zinc-100 text-base mb-1">{s.subject}</div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                                        <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">{formatDuration(s.hours)}</span>
                                        {s.notes && <span className="opacity-60 font-normal truncate max-w-[120px]">{s.notes}</span>}
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteSession(s.id)} className="text-zinc-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 italic text-sm">
                            <BookOpen size={32} className="mb-2 opacity-20" />
                            No sessions logged yet today.
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Input Form */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col order-1 md:order-2 relative bg-white dark:bg-zinc-900">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Add Session</h3>
                        <p className="text-sm text-zinc-400 font-medium uppercase tracking-wide mt-1">{selectedDate}</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSaveSession} className="space-y-6 flex-1">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Subject</label>
                        <div className="relative">
                            <select 
                                value={inputSubject}
                                onChange={(e) => setInputSubject(e.target.value)}
                                className="w-full appearance-none bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-5 text-zinc-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-lg"
                            >
                                {Object.keys(activeStreamSubjects).map(s => <option key={s} value={s} className="dark:bg-zinc-900">{s}</option>)}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400"><ChevronRight size={18} className="rotate-90"/></div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Duration</label>
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <input type="number" min="0" max="23" value={inputHours} onChange={(e) => setInputHours(e.target.value)} placeholder="0" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-5 text-center text-2xl font-black text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-all" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">Hr</span>
                            </div>
                            <div className="flex-1 relative">
                                <input type="number" min="0" max="59" value={inputMinutes} onChange={(e) => setInputMinutes(e.target.value)} placeholder="0" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-5 text-center text-2xl font-black text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-all" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">Min</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Notes</label>
                        <textarea value={inputNotes} onChange={(e) => setInputNotes(e.target.value)} placeholder="What did you achieve?" rows={2} className="w-full p-4 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-zinc-700 dark:text-zinc-200 text-sm placeholder:text-zinc-400" />
                    </div>
                    
                    <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 mt-auto">
                        {isLoading ? "Saving..." : <><Save size={18} /> Add Session</>}
                    </button>
                </form>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
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