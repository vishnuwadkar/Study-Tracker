import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  LayoutDashboard,
  ListChecks,
  Timer,
  Play,
  Pause,
  Square,
  ChevronDown,
  ChevronUp,
  Maximize,
  Minimize,
  AlertTriangle,
  Check,
  RefreshCw,
  User,
  BrainCircuit,
  Plus,
  Youtube
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
import Videos from './components/Videos';

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

// Detailed Syllabus Data based on GATE 2026 PDF
const SYLLABUS_DATA = {
  DA: {
    "Probability & Statistics": {
        weight: 17,
        topics: [
            "Counting (permutation and combinations)", "Probability axioms", "Sample space & events", 
            "Independent & mutually exclusive events", "Marginal, conditional and joint probability", "Bayes Theorem", 
            "Conditional expectation and variance", "Mean, median, mode and standard deviation", 
            "Correlation and covariance", "Random variables", "Discrete random variables & PMF", 
            "Uniform, Bernoulli, binomial distribution", "Continuous random variables & PDF", 
            "Uniform, exponential, Poisson, normal, standard normal", "t-distribution, chi-squared distributions", 
            "Cumulative distribution function", "Conditional PDF", "Central limit theorem", 
            "Confidence interval", "z-test, t-test, chi-squared test"
        ]
    },
    "Linear Algebra": {
        weight: 11,
        topics: [
            "Vector space, subspaces", "Linear dependence and independence", "Matrices & Projection matrix", 
            "Orthogonal matrix, Idempotent matrix", "Partition matrix and their properties", "Quadratic forms", 
            "Systems of linear equations and solutions", "Gaussian elimination", "Eigenvalues and eigenvectors", 
            "Determinant, rank, nullity", "Projections", "LU decomposition", "Singular value decomposition"
        ]
    },
    "Calculus & Optimization": {
        weight: 8.5,
        topics: [
            "Functions of a single variable", "Limit, continuity and differentiability", "Taylor series", 
            "Maxima and minima", "Optimization involving a single variable"
        ]
    },
    "Programming, DS & Algo": {
        weight: 17,
        topics: [
            "Programming in Python", "Stacks, queues, linked lists", "Trees, hash tables", 
            "Linear search and binary search", "Selection sort, bubble sort and insertion sort", 
            "Divide and conquer: mergesort, quicksort", "Introduction to graph theory", "Graph traversals and shortest path"
        ]
    },
    "Database Mgmt & Warehousing": {
        weight: 8.5,
        topics: [
            "ER-model, Relational model", "Relational algebra, tuple calculus", "SQL, integrity constraints", 
            "Normal form", "File organization, indexing", "Data types", "Data transformation (normalization, discretization, sampling)", 
            "Data warehouse modelling: schema for multidimensional data models", "Concept hierarchies", "Measures: categorization and computations"
        ]
    },
    "Machine Learning": {
        weight: 15,
        topics: [
            "Supervised Learning: regression and classification", "Simple & multiple linear regression", "Ridge regression, logistic regression", 
            "k-nearest neighbour, naive Bayes classifier", "Linear discriminant analysis", "Support vector machine", 
            "Decision trees", "Bias-variance trade-off", "Cross-validation (LOO, k-folds)", 
            "Multi-layer perceptron, feed-forward neural network", "Unsupervised Learning: clustering algorithms", 
            "k-means/k-medoid, hierarchical clustering", "Dimensionality reduction (PCA)"
        ]
    },
    "Artificial Intelligence": {
        weight: 8.5,
        topics: [
            "Search: informed, uninformed, adversarial", "Logic, propositional, predicate", 
            "Reasoning under uncertainty", "Conditional independence representation", 
            "Exact inference through variable elimination", "Approximate inference through sampling"
        ]
    },
    "General Aptitude": {
        weight: 15,
        topics: ["Verbal Ability", "Quantitative Aptitude", "Analytical Aptitude", "Spatial Aptitude"]
    },
    "Other": {
        weight: 0,
        topics: ["Mock Tests", "Revision", "Miscellaneous"]
    }
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
    "Engineering Math": { weight: 10, topics: ["Linear Algebra", "Calculus", "Probability", "Discrete Math"] },
    "Other": { weight: 0, topics: ["Mock Tests", "Revision", "Miscellaneous"] }
  },
  // Fallback structure for other streams
  Other: { "General Subject": { weight: 100, topics: ["Topic 1", "Topic 2"] } }
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

const formatTimeOnly = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const formatTimer = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// --- Custom Components ---
const CustomSelect = ({ value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => { if (ref.current && !ref.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={ref}>
            <div onClick={() => setIsOpen(!isOpen)} className="w-full bg-zinc-50/50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-5 text-zinc-900 dark:text-white font-bold flex justify-between items-center cursor-pointer hover:border-amber-500/50 transition-all backdrop-blur-md">
                <span className={!value ? "text-zinc-400" : ""}>{value || placeholder}</span>
                <ChevronDown size={18} className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-50 custom-scrollbar">
                    {options.map(opt => (
                        <div key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`px-5 py-3 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer text-zinc-700 dark:text-zinc-200 font-medium transition-colors ${value === opt ? 'text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/5' : ''}`}>{opt}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

const App = () => {
  // --- State ---
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); 
  const [entries, setEntries] = useState({}); 
  const [syllabusProgress, setSyllabusProgress] = useState({});
  const [activeView, setActiveView] = useState('dashboard'); 
  const [userSettings, setUserSettings] = useState({ stream: 'DA', dailyTarget: 8, displayName: '', youtubeApiKey: '' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view' | 'add'
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null); 
  
  // Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null); 
  const [timerSubject, setTimerSubject] = useState('');
  const [isZenMode, setIsZenMode] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Form
  const [inputHours, setInputHours] = useState('');
  const [inputMinutes, setInputMinutes] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [inputSubject, setInputSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return false;
  });

  // --- Effects ---
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && startTime) {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      setTimerSeconds(diff);
      document.title = `${formatTimer(diff)} - Focus`;
      localStorage.setItem('timerStart', startTime.toString());
      localStorage.setItem('isTimerRunning', 'true');
      localStorage.setItem('timerSubject', timerSubject);
      if(sessionStartTime) localStorage.setItem('sessionStartTime', sessionStartTime);
      interval = setInterval(() => {
        const now = Date.now();
        const currentDiff = Math.floor((now - startTime) / 1000);
        setTimerSeconds(currentDiff);
        document.title = `${formatTimer(currentDiff)} - Focus`;
      }, 1000);
    } else {
        document.title = "GATE 2026 Tracker";
        if(!isTimerRunning) {
            localStorage.removeItem('timerStart');
            localStorage.removeItem('isTimerRunning');
            localStorage.removeItem('sessionStartTime');
        }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, startTime, timerSubject, sessionStartTime]);

  const requestWakeLock = async () => { if ('wakeLock' in navigator) { try { const lock = await navigator.wakeLock.request('screen'); setWakeLock(lock); } catch (err) { console.log(err); } } };
  const releaseWakeLock = async () => { if (wakeLock) { await wakeLock.release(); setWakeLock(null); } };

  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, setUser); return () => unsubscribe(); }, []);
  useEffect(() => {
    if (!user) return;
    const logsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'study_log');
    const unsubLogs = onSnapshot(logsRef, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => { data[doc.id] = doc.data(); });
      setEntries(data);
    });
    const sylRef = doc(db, 'artifacts', appId, 'users', user.uid, 'syllabus', 'progress');
    const unsubSyl = onSnapshot(sylRef, (doc) => { if (doc.exists()) setSyllabusProgress(doc.data()); });
    const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
    getDoc(settingsRef).then((snap) => {
        if (snap.exists()) {
            const data = snap.data();
            setUserSettings(prev => ({ ...prev, ...data }));
            if (!timerSubject && data.stream && SYLLABUS_DATA[data.stream]) {
                setTimerSubject(Object.keys(SYLLABUS_DATA[data.stream])[0]);
            }
        }
    });
    return () => { unsubLogs(); unsubSyl(); };
  }, [user]);
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) { root.classList.add('dark'); localStorage.setItem('theme', 'dark'); } 
    else { root.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDarkMode]);
  useEffect(() => {
    if (!timerSubject && userSettings.stream && SYLLABUS_DATA[userSettings.stream]) {
        setTimerSubject(Object.keys(SYLLABUS_DATA[userSettings.stream])[0]);
    }
  }, [userSettings.stream, timerSubject]);

  // --- Handlers ---
  const handleStartTimer = () => {
    const now = Date.now();
    // Resume correctly by offsetting the start time by the elapsed seconds
    const newStart = now - (timerSeconds * 1000); 
    setStartTime(newStart);
    
    // Only set session start time if it's a fresh start (timer was at 0)
    if (!sessionStartTime && timerSeconds === 0) { 
        const sStart = new Date().toISOString(); 
        setSessionStartTime(sStart); 
        localStorage.setItem('sessionStartTime', sStart); 
    }
    
    setIsTimerRunning(true); 
    requestWakeLock();
  };
  const handlePauseTimer = () => { setIsTimerRunning(false); releaseWakeLock(); };
  const handleTimerFinish = () => {
    setIsTimerRunning(false); setIsZenMode(false); releaseWakeLock();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    const h = Math.floor(timerSeconds / 3600); const m = Math.round((timerSeconds % 3600) / 60);
    const today = new Date(); const dateKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    setSelectedDate(dateKey); setInputHours(h.toString()); setInputMinutes(m.toString()); setInputSubject(timerSubject);
    
    // Pre-fill notes but DO NOT clear sessionStartTime yet
    const timeStr = sessionStartTime ? formatTimeOnly(sessionStartTime) : formatTimeOnly(new Date().toISOString());
    setInputNotes(`Started at ${timeStr} via Focus Timer`);
    
    setTimerSeconds(0); setStartTime(null); 
    // Don't clear sessionStartTime here, wait for save
    localStorage.removeItem('timerStart'); localStorage.removeItem('isTimerRunning'); 
    
    setIsModalOpen(true); setActiveView('dashboard'); setModalMode('add');
  };
  const handleGoogleLogin = async () => { const provider = new GoogleAuthProvider(); try { await signInWithPopup(auth, provider); } catch (error) { alert(error.message); } };
  const handleLogout = async () => { try { await signOut(auth); setEntries({}); setSyllabusProgress({}); setIsSettingsOpen(false); } catch (error) { console.error(error); } };
  const handleSaveSettings = async () => { if (!user) return; try { const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config'); await setDoc(settingsRef, userSettings); setIsSettingsOpen(false); } catch (err) { console.error(err); } };
  const toggleSyllabusItem = async (subject, topic, field) => {
    if (!user) return;
    const newProgress = { ...syllabusProgress };
    if (!newProgress[subject]) newProgress[subject] = {};
    if (!newProgress[subject][topic]) newProgress[subject][topic] = { done: false, rev: 0 };
    if (field === 'done') newProgress[subject][topic].done = !newProgress[subject][topic].done;
    else if (field === 'rev_inc') newProgress[subject][topic].rev = (newProgress[subject][topic].rev || 0) + 1;
    else if (field === 'rev_dec') newProgress[subject][topic].rev = Math.max(0, (newProgress[subject][topic].rev || 0) - 1);
    setSyllabusProgress(newProgress);
    try { const sylRef = doc(db, 'artifacts', appId, 'users', user.uid, 'syllabus', 'progress'); await setDoc(sylRef, newProgress); } catch (err) { console.error(err); }
  };
  const toggleSubjectExpand = (subject) => setExpandedSubjects(prev => ({...prev, [subject]: !prev[subject]}));
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleDayClick = (day) => {
    const dateKey = formatDateKey(year, month, day);
    setSelectedDate(dateKey); setInputHours(''); setInputMinutes(''); setInputNotes('');
    setInputSubject(Object.keys(SYLLABUS_DATA[userSettings.stream] || {})[0] || 'Other');
    setSessionStartTime(null); // Reset for manual entry
    setModalMode('view'); setIsModalOpen(true);
  };
  const handleSaveSession = async (e) => {
    e.preventDefault();
    if (!user || !selectedDate) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'study_log', selectedDate);
      const h = parseInt(inputHours || '0'); const m = parseInt(inputMinutes || '0');
      const sessionHours = h + (m / 60);
      if (sessionHours > 0) {
        const currentEntry = entries[selectedDate] || {};
        let sessions = currentEntry.sessions || [];
        if (!currentEntry.sessions && currentEntry.hours) { sessions = [{ id: 'legacy', subject: currentEntry.subject || 'Other', hours: currentEntry.hours, notes: currentEntry.notes || '' }]; }
        
        // Use stored start time if available (from timer), else current time
        let timeLog = sessionStartTime || new Date().toISOString(); 
        
        const newSession = { id: Date.now().toString(), subject: inputSubject, hours: sessionHours, notes: inputNotes, timestamp: timeLog };
        const updatedSessions = [...sessions, newSession];
        updatedSessions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const newTotalHours = updatedSessions.reduce((sum, s) => sum + s.hours, 0);
        await setDoc(docRef, { hours: newTotalHours, sessions: updatedSessions, updatedAt: new Date().toISOString() });
      }
      setInputHours(''); setInputMinutes(''); setInputNotes(''); 
      setSessionStartTime(null); localStorage.removeItem('sessionStartTime'); // Clear start time after save
      setIsLoading(false); setModalMode('view');
    } catch (err) { console.error("Save error", err); setIsLoading(false); }
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
        setDeleteConfirm(null);
    } catch (err) { console.error(err); }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // --- Analytics ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const stats = useMemo(() => {
    let monthlyTotal = 0; let daysStudied = 0; let daysTargetMet = 0; let streak = 0;
    const subjectTotals = {}; let last7DaysTotal = 0;
    const todayKey = formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const todaySubjects = {};
    let todayHours = 0;
    const timeOfDay = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    // Calendar Stats
    for (let d = 1; d <= daysInMonth; d++) {
      const key = formatDateKey(year, month, d);
      const entry = entries[key];
      if (entry && entry.hours > 0) {
        monthlyTotal += entry.hours;
        daysStudied++;
        if (entry.hours >= userSettings.dailyTarget) daysTargetMet++;
        if (entry.sessions) {
            entry.sessions.forEach(s => { 
                const sub = s.subject || "Other"; 
                subjectTotals[sub] = (subjectTotals[sub] || 0) + s.hours;
                // Time of day analysis
                if(s.timestamp) {
                    const hour = new Date(s.timestamp).getHours();
                    if(hour >= 5 && hour < 12) timeOfDay.morning += s.hours;
                    else if(hour >= 12 && hour < 17) timeOfDay.afternoon += s.hours;
                    else if(hour >= 17 && hour < 22) timeOfDay.evening += s.hours;
                    else timeOfDay.night += s.hours;
                }
            });
        } else { const sub = entry.subject || "Other"; subjectTotals[sub] = (subjectTotals[sub] || 0) + entry.hours; }
        
        if (key === todayKey) {
            todayHours = entry.hours;
            if (entry.sessions) {
                entry.sessions.forEach(s => { const sub = s.subject || "Other"; todaySubjects[sub] = (todaySubjects[sub] || 0) + s.hours; });
            }
        }
      }
    }

    const sortedSubjects = Object.entries(subjectTotals).sort(([,a], [,b]) => b - a).map(([name, hours]) => ({ name, hours, percent: monthlyTotal > 0 ? (hours / monthlyTotal) * 100 : 0 }));
    const todayBreakdown = Object.entries(todaySubjects).sort(([,a], [,b]) => b - a);
    
    // Determine peak productivity
    const peakTime = Object.entries(timeOfDay).sort(([,a], [,b]) => b - a)[0]?.[0] || '-';
    const bestSubject = sortedSubjects.length > 0 ? sortedSubjects[0].name : "None";

    const today = new Date();
    let temp = new Date(today);
    for(let i=0; i<365; i++) {
        const k = formatDateKey(temp.getFullYear(), temp.getMonth(), temp.getDate());
        const entry = entries[k];
        const isToday = k === todayKey;
        if (entry && entry.hours >= userSettings.dailyTarget) streak++;
        else if (!isToday) break; 
        temp.setDate(temp.getDate() - 1);
    }

    const weeklyData = [];
    const chartEnd = new Date(today); // normalized
    for(let i=6; i>=0; i--) {
        const d = new Date(chartEnd);
        d.setDate(d.getDate() - i);
        const k = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
        const hrs = entries[k]?.hours || 0;
        last7DaysTotal += hrs;
        weeklyData.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), hours: hrs, isTarget: hrs >= userSettings.dailyTarget });
    }

    const examDiff = EXAM_DATE.getTime() - today.getTime(); 
    const daysRemaining = Math.ceil(examDiff / (1000 * 60 * 60 * 24));

    // Weighted Syllabus
    let totalWeightedScore = 0; let achievedWeightedScore = 0; let totalRevisions = 0;
    const streamData = SYLLABUS_DATA[userSettings.stream] || {};
    const allSubjectTotals = {}; // Accumulate totals for syllabus view

    // We must iterate through LOGGED hours to calculate subject progress properly if needed? 
    // Actually, the prompt requested "Hours spent on each subject in front of each subject".
    // We already have `subjectTotals` from above.
    
    Object.entries(streamData).forEach(([subject, data]) => {
        const weight = data.weight || 0; const topics = data.topics || [];
        const topicWeight = weight / (topics.length || 1);
        totalWeightedScore += weight;
        topics.forEach(topic => {
            const prog = syllabusProgress[subject]?.[topic];
            if (prog?.done) achievedWeightedScore += topicWeight;
            if (prog?.rev) totalRevisions += prog.rev;
        });
    });
    const syllabusCompletion = totalWeightedScore > 0 ? Math.round((achievedWeightedScore / totalWeightedScore) * 100) : 0;

    return { monthlyTotal: parseFloat(monthlyTotal.toFixed(1)), avgDaily: daysStudied > 0 ? parseFloat((monthlyTotal / daysStudied).toFixed(1)) : 0, completionRate: daysInMonth > 0 ? Math.round((daysTargetMet / new Date().getDate()) * 100) : 0, streak, weeklyData, last7DaysTotal: parseFloat(last7DaysTotal.toFixed(1)), sortedSubjects, daysRemaining, syllabusCompletion, totalRevisions, todayHours, todayBreakdown, peakTime, bestSubject, subjectTotals };
  }, [entries, year, month, daysInMonth, userSettings, syllabusProgress]);

  const getCellColor = (hours) => {
    const target = userSettings.dailyTarget;
    if (!hours) return 'bg-white dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-zinc-200 dark:border-white/5';
    if (hours >= target) return 'bg-amber-500 dark:bg-amber-600 text-white border-amber-600 dark:border-amber-500/50 shadow-md shadow-amber-200 dark:shadow-amber-900/20'; 
    if (hours >= target / 2) return 'bg-amber-100 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800/50'; 
    return 'bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-white/5'; 
  };

  const getSelectedSessions = () => {
    if (!selectedDate || !entries[selectedDate]) return [];
    const entry = entries[selectedDate];
    if (entry.sessions) return entry.sessions;
    if (entry.hours > 0) return [{ id: 'legacy', subject: entry.subject || 'Other', hours: entry.hours, notes: entry.notes }];
    return [];
  };

  const activeStreamSubjects = SYLLABUS_DATA[userSettings.stream] ? Object.keys(SYLLABUS_DATA[userSettings.stream]) : [];

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-3xl shadow-2xl dark:shadow-none backdrop-blur-xl border border-zinc-200 dark:border-white/10 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] animate-pulse-slow pointer-events-none"></div>
          <div className="bg-amber-100 dark:bg-amber-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-600 dark:text-amber-400 ring-4 ring-amber-50 dark:ring-amber-900/20 relative z-10">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight relative z-10">GATE<span className="text-amber-500 dark:text-amber-400">2026</span></h1>
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
    <div className={`min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300 selection:bg-amber-500/30 ${isTimerRunning && isZenMode ? 'overflow-hidden' : ''}`}>
      
      {/* Top Navigation (Hidden in Zen Mode) */}
      {(!isTimerRunning || !isZenMode) && (
        <nav className="bg-white/80 dark:bg-black/50 border-b border-zinc-200 dark:border-white/10 sticky top-0 z-30 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/50 transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
                {/* Left */}
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="bg-gradient-to-tr from-amber-500 to-orange-500 text-white p-2.5 rounded-xl shadow-lg shadow-amber-500/20 dark:shadow-none">
                        <GraduationCap size={22} />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">
                            GATE <span className="text-amber-500 dark:text-amber-400">2026</span>
                        </h1>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest">{userSettings.stream}</p>
                    </div>
                    
                    <button 
                        onClick={() => setActiveView('timer')}
                        className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${activeView === 'timer' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'}`}
                    >
                        <Timer size={16} className={activeView === 'timer' ? 'animate-pulse' : ''}/>
                        <span className="hidden sm:inline">Focus Mode</span>
                    </button>
                </div>

                {/* Center */}
                <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200 dark:border-white/10">
                    <button onClick={() => setActiveView('videos')} className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'videos' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
                        <Youtube size={14} /> <span className="hidden sm:inline">Videos</span>
                    </button>
                    <button onClick={() => setActiveView('dashboard')} className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'dashboard' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
                        <LayoutDashboard size={14} /> <span className="hidden sm:inline">Tracker</span>
                    </button>
                    <button onClick={() => setActiveView('syllabus')} className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'syllabus' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
                        <ListChecks size={14} /> <span className="hidden sm:inline">Syllabus</span>
                    </button>
                </div>

                {/* Right */}
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

      <main className={`max-w-6xl mx-auto p-4 sm:p-6 ${isTimerRunning && isZenMode ? 'h-[100dvh] w-[100vw] fixed inset-0 z-[9999] bg-black flex items-center justify-center p-0 m-0 max-w-none overflow-hidden' : ''}`}>
        
        {/* VIEW: DASHBOARD */}
        <div style={{ display: activeView === 'dashboard' ? 'block' : 'none' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column */}
                <div className="space-y-6 lg:col-span-1 lg:sticky lg:top-28 lg:h-fit order-2 lg:order-1">

                    {/* 4. STREAK CARD */}
                    <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10 relative overflow-hidden transition-colors duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 dark:bg-amber-500/10 rounded-full -mr-10 -mt-10 blur-3xl animate-pulse-slow"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                                <Zap size={18} fill="currentColor" className={stats.streak > 0 ? "animate-pulse" : ""} />
                                <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
                            </div>
                            <div className="text-5xl font-black text-zinc-900 dark:text-white tracking-tight">
                                {stats.streak}<span className="text-lg text-zinc-400 dark:text-zinc-500 font-medium ml-1">days</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* 1. HOURS LEFT TODAY */}
                    <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Daily Target</h3>
                            <Target size={18} className="text-amber-500" />
                        </div>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                                {parseFloat(Math.max(0, userSettings.dailyTarget - stats.todayHours).toFixed(1))}
                            </span>
                            <span className="text-lg font-medium text-zinc-400 mb-1">hours left</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-white/5 rounded-full h-3 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-700 ${stats.todayHours >= userSettings.dailyTarget ? 'bg-amber-500' : 'bg-zinc-800 dark:bg-white'}`} 
                                style={{ width: `${Math.min(100, (stats.todayHours / userSettings.dailyTarget) * 100)}%` }}
                            ></div>
                        </div>
                        {stats.todayHours >= userSettings.dailyTarget && (
                            <div className="absolute inset-0 bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center backdrop-blur-sm animate-in fade-in">
                                <div className="bg-white dark:bg-black p-3 rounded-2xl shadow-xl flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-900/50">
                                    <Crown size={20} fill="currentColor" /> Goal Crushed!
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. TODAY'S BREAKDOWN */}
                    <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10">
                        <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Studied Today</h3>
                        <div className="space-y-3">
                            {stats.todayBreakdown.length > 0 ? (
                                stats.todayBreakdown.map(([sub, hours]) => (
                                    <div key={sub} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">{sub}</span>
                                        </div>
                                        <span className="font-mono text-zinc-500 dark:text-zinc-500">{formatDuration(hours)}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-zinc-400 italic">No sessions logged yet.</p>
                            )}
                        </div>
                    </div>

                    {/* 5. SYLLABUS STATUS */}
                    <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div>
                                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Syllabus Status</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{stats.syllabusCompletion}%</span>
                                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Completed</span>
                                </div>
                            </div>
                            <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg">
                                <BookOpen size={20} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <div className="relative w-full h-4 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
                            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.4)]" style={{ width: `${stats.syllabusCompletion}%` }}>
                                <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50 blur-[1px]"></div>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-400 mt-3 font-medium flex items-center gap-1"><Zap size={12} className="text-amber-500" fill="currentColor" /><span>{stats.totalRevisions} total topic revisions recorded</span></p>
                    </div>

                    {/* 6. MINI STATS */}
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
                    {/* 2. SMART INSIGHTS */}
                    <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10">
                        <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <BrainCircuit size={16} className="text-amber-500" /> Productivity
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-white/5 rounded-xl">
                                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Peak Time</span>
                                <span className="text-sm font-bold text-zinc-800 dark:text-white capitalize">{stats.peakTime || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-white/5 rounded-xl">
                                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Top Subject</span>
                                <span className="text-sm font-bold text-zinc-800 dark:text-white truncate max-w-[120px]">{stats.bestSubject}</span>
                            </div>
                        </div>
                    </div>

                    {/* 7. WEEKLY CHART */}
                    <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/10 transition-colors duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={18} className="text-zinc-400" />
                                <h3 className="font-bold text-zinc-700 dark:text-zinc-200">Weekly Velocity</h3>
                            </div>
                            <div className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-500/20">Total: {stats.last7DaysTotal}h</div>
                        </div>
                        <div className="flex items-end justify-between h-32 gap-2 mt-4">
                            {stats.weeklyData.map((d, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 w-full h-full justify-end group">
                                    <div className="w-full flex-1 relative bg-zinc-100 dark:bg-zinc-800 rounded-t-lg overflow-hidden">
                                        <div 
                                            className={`absolute bottom-0 left-0 w-full rounded-t-lg transition-all duration-500 ${d.isTarget ? 'bg-amber-500 dark:bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-zinc-300 dark:bg-zinc-600 group-hover:bg-zinc-400 dark:group-hover:bg-zinc-500'}`} 
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

                {/* Right Column: Calendar (Order 1 on Mobile) */}
                <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
                    {/* Countdown Card - Responsive Layout Fix */}
                    <div className="bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-600/20 backdrop-blur-2xl p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-2xl shadow-amber-500/10 text-zinc-900 dark:text-white relative overflow-hidden border border-amber-500/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full -mr-20 -mt-20 blur-[70px] animate-pulse-fast"></div>
                        <div className="relative z-10 flex flex-row items-center justify-between gap-4"> {/* Forced row layout for mobile */}
                            <div className="text-left">
                                <div className="flex items-center justify-start gap-2 mb-1">
                                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-zinc-100 dark:bg-white/10 text-[10px] font-bold uppercase tracking-widest border border-zinc-200 dark:border-white/10">Exam Date</span>
                                    <span className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium">Feb 15, 2026</span>
                                </div>
                                <h3 className="text-2xl sm:text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400">
                                    {stats.daysRemaining} <span className="text-lg sm:text-2xl md:text-3xl font-medium text-zinc-500">days</span>
                                </h3>
                            </div>
                            <div className="bg-amber-250/10 p-3 sm:p-5 rounded-xl sm:rounded-3xl backdrop-blur-md border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.2)] flex-shrink-0">
                                <Hourglass className="text-amber-200 animate-pulse drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] w-6 h-6 sm:w-10 sm:h-10" />
                            </div>
                        </div>
                    </div>

                    {/* Calendar Container */}
                    <div className="bg-transparent rounded-3xl shadow-none transition-colors duration-300 relative">
                         <div className="absolute top-20 right-10 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] -z-10"></div>
                         <div className="absolute bottom-10 left-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -z-10"></div>

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
                                                ${isToday ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-black' : ''}
                                            `}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={`text-sm font-bold ${metTarget ? 'text-white/90' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`}>{day}</span>
                                                {metTarget && <Crown size={16} className="text-yellow-300 fill-yellow-300 drop-shadow-md animate-pulse-slow absolute top-1 right-1 sm:static" />}
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
        </div>

        {/* VIEW: VIDEOS (Always Mounted to Prevent Iframe Refresh) */}
        <div style={{ display: activeView === 'videos' ? 'block' : 'none', height: '100%' }}>
            <Videos db={db} user={user} appId={appId} />
        </div>
        
        {/* VIEW: TIMER */}
        {activeView === 'timer' && (
            <div className={`w-full h-full flex flex-col justify-center items-center relative transition-all duration-700 ${isZenMode ? 'scale-100 fixed inset-0 z-[200] bg-black' : ''}`}>
                {/* Background Deep Space Zen */}
                <div className="absolute inset-0 bg-black">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-600/20 rounded-full blur-[150px] animate-pulse-slow"></div>
                    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[150px]"></div>
                </div>
                
                <div className={`w-full max-w-2xl p-4 sm:p-12 text-center relative z-10 transition-all duration-500 flex flex-col items-center justify-center h-full`}>
                    
                    {!isZenMode && (
                        <div className="mb-8 sm:mb-12 w-full flex flex-col items-center">
                            <label className="text-xs font-bold text-amber-500/80 uppercase tracking-[0.2em] mb-4 block">Focus Session</label>
                            <div className="relative inline-block w-full max-w-sm">
                                <CustomSelect 
                                    value={timerSubject} 
                                    onChange={setTimerSubject} 
                                    options={activeStreamSubjects}
                                    placeholder="Select Subject"
                                />
                            </div>
                        </div>
                    )}

                    {/* Responsive Text Size using vw units for Zen Mode */}
                    <div className={`font-black font-mono text-white tracking-tighter mb-8 sm:mb-16 tabular-nums transition-all duration-700 ${isZenMode ? 'text-[18vw] sm:text-[12rem] md:text-[14rem] drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'text-5xl sm:text-7xl md:text-9xl drop-shadow-2xl'}`}>
                        {formatTimer(timerSeconds)}
                    </div>

                    {/* Zen Mode Toggle */}
                    {isTimerRunning && (
                        <button 
                            onClick={toggleFullscreen}
                            className="absolute top-6 right-6 p-4 text-white/30 hover:text-white transition-colors z-50"
                        >
                            {isZenMode ? <Minimize size={24} /> : <Maximize size={24} />}
                        </button>
                    )}

                    <div className="flex items-center justify-center gap-8 relative z-10">
                        {!isTimerRunning ? (
                            <button 
                                onClick={handleStartTimer}
                                className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500 text-white shadow-[0_0_50px_rgba(16,185,129,0.4)] hover:scale-110 hover:shadow-[0_0_80px_rgba(16,185,129,0.6)] transition-all duration-300"
                            >
                                <Play size={36} fill="currentColor" className="ml-1" />
                            </button>
                        ) : (
                            <button 
                                onClick={handlePauseTimer}
                                className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-amber-500 text-white shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:scale-110 hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] transition-all duration-300"
                            >
                                <Pause size={36} fill="currentColor" />
                            </button>
                        )}

                        <button 
                            onClick={handleTimerFinish}
                            disabled={timerSeconds === 0}
                            className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-red-500/50 hover:text-red-500 hover:shadow-[0_0_40px_rgba(239,68,68,0.2)] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-zinc-800"
                        >
                            <Square size={28} fill="currentColor" />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: SYLLABUS */}
        <div style={{ display: activeView === 'syllabus' ? 'block' : 'none' }}>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Syllabus</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Weighted tracking of topic completion and revisions.</p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Weighted Progress</p>
                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.syllabusCompletion}%</div>
                    </div>
                </div>

                <div className="space-y-6">
                    {Object.entries(SYLLABUS_DATA[userSettings.stream] || {}).map(([subject, data]) => {
                        const topics = data.topics || [];
                        const weight = data.weight || 0;
                        const isExpanded = expandedSubjects[subject];
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
                                                <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-2">{stats.subjectTotals[subject] ? formatDuration(stats.subjectTotals[subject]) : '0m'} spent</span>
                                            </div>
                                            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">{percent}% Done</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                                            <div className={`h-2 rounded-full transition-all duration-500 ${percent === 100 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }}></div>
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
                                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${tData.done ? 'bg-amber-500 border-amber-500 text-white' : 'border-zinc-300 dark:border-zinc-600 text-transparent group-hover:border-amber-400'}`}>
                                                            <Check size={12} strokeWidth={3} />
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
        </div>
      </main>

      {/* Footer (Hidden in Zen Mode) */}
      {(!isTimerRunning || !isZenMode) && (
        <footer className="py-10 text-center text-sm text-zinc-400 dark:text-zinc-600">
            <p>&copy; {new Date().getFullYear()} <span className="font-bold text-zinc-500 dark:text-zinc-500">@vishnuwadkar</span>. All rights reserved.</p>
        </footer>
      )}
      
      {/* Modal: Log Session */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/20 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl dark:shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-white/10 flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Mode Switcher (Mobile) */}
            <div className="md:hidden flex border-b border-zinc-200 dark:border-white/5">
                <button onClick={() => setModalMode('view')} className={`flex-1 py-4 text-sm font-bold text-center ${modalMode === 'view' ? 'text-amber-500 bg-zinc-50 dark:bg-white/5' : 'text-zinc-400'}`}>Overview</button>
                <button onClick={() => setModalMode('add')} className={`flex-1 py-4 text-sm font-bold text-center ${modalMode === 'add' ? 'text-amber-500 bg-zinc-50 dark:bg-white/5' : 'text-zinc-400'}`}>Add Session</button>
            </div>

            {/* Left Column: Day Overview */}
            <div className={`w-full md:w-1/2 bg-zinc-50/50 dark:bg-black/20 p-6 md:p-8 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-white/5 flex-col h-full md:flex ${modalMode === 'view' ? 'flex' : 'hidden'}`}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Day Overview</h3>
                        <p className="text-xs text-zinc-400 font-medium mt-1">{selectedDate}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-amber-500">{parseFloat((entries[selectedDate]?.hours || 0).toFixed(1))}h</span>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase">Total Time</p>
                    </div>
                </div>

                {/* Mobile Close Button (Only visible on mobile view tab) */}
                <div className="flex justify-end mb-2 md:hidden">
                    <button onClick={() => setIsModalOpen(false)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:bg-zinc-200"><X size={18}/></button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {getSelectedSessions().length > 0 ? (
                        getSelectedSessions().map((s, idx) => (
                            <div key={s.id || idx} className="flex items-center justify-between bg-white dark:bg-white/5 p-4 rounded-2xl border border-zinc-100 dark:border-white/5 hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all group shadow-sm">
                                <div>
                                    <div className="font-bold text-zinc-800 dark:text-zinc-100 text-base mb-1">{s.subject}</div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                                        <span className="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-md">{formatDuration(s.hours)}</span>
                                        {s.timestamp && <span className="text-zinc-400">{formatTimeOnly(s.timestamp)}</span>}
                                    </div>
                                </div>
                                <button onClick={() => setDeleteConfirm(s.id)} className="text-zinc-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100">
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

                {/* Desktop: Add Session Button (Moves to Right Pane) */}
                <div className="mt-6 md:hidden">
                     <button onClick={() => setModalMode('add')} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg">
                        <Plus size={18} /> Add Session
                     </button>
                </div>
            </div>

            {/* Right Column: Input Form */}
            <div className={`w-full md:w-1/2 p-6 md:p-8 flex-col relative bg-white dark:bg-zinc-900 h-full md:flex ${modalMode === 'add' ? 'flex' : 'hidden'}`}>
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
                        <CustomSelect 
                            value={inputSubject}
                            onChange={setInputSubject}
                            options={activeStreamSubjects}
                            placeholder="Select Subject"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Duration</label>
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <input type="number" min="0" max="23" value={inputHours} onChange={(e) => setInputHours(e.target.value)} placeholder="0" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-5 text-center text-2xl font-black text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-all" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">Hr</span>
                            </div>
                            <div className="flex-1 relative">
                                <input type="number" min="0" max="59" value={inputMinutes} onChange={(e) => setInputMinutes(e.target.value)} placeholder="0" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-5 text-center text-2xl font-black text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-all" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">Min</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Notes</label>
                        <textarea value={inputNotes} onChange={(e) => setInputNotes(e.target.value)} placeholder="What did you achieve?" rows={2} className="w-full p-4 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none text-zinc-700 dark:text-zinc-200 text-sm placeholder:text-zinc-400" />
                    </div>
                    
                    <div className="mt-auto flex gap-3">
                        <button type="button" onClick={() => setModalMode('view')} className="flex-1 md:hidden py-4 rounded-2xl font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800">Back</button>
                        <button type="submit" disabled={isLoading} className="flex-[2] w-full bg-amber-500 text-white py-4 rounded-2xl font-bold hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                            {isLoading ? "Saving..." : <><Save size={18} /> Save Session</>}
                        </button>
                    </div>
                </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-2xl w-full max-w-xs text-center border border-zinc-200 dark:border-white/10">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Delete Session?</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                    <button onClick={() => handleDeleteSession(deleteConfirm)} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Delete</button>
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
                        <Settings size={20} className="text-amber-500"/> Preferences
                    </h3>
                    <button onClick={() => setIsSettingsOpen(false)} className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"><X size={18} /></button>
                </div>

                <div className="space-y-6">
                    {/* Profile Section (NEW) */}
                    <div>
                        <label className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block">Profile</label>
                        <div className="bg-zinc-50 dark:bg-black/20 p-4 rounded-2xl border border-zinc-100 dark:border-white/5 flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <User size={20} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <input 
                                    type="text" 
                                    placeholder="Enter your name"
                                    value={userSettings.displayName || ''}
                                    onChange={(e) => setUserSettings({...userSettings, displayName: e.target.value})}
                                    className="bg-transparent font-bold text-zinc-900 dark:text-white outline-none w-full placeholder:text-zinc-400"
                                />
                                <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stream Selector */}
                    <div>
                        <label className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block">GATE Stream</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.keys(STREAM_NAMES).filter(k => k !== 'Other').map(key => (
                                <button
                                    key={key}
                                    onClick={() => setUserSettings({...userSettings, stream: key})}
                                    className={`p-3 rounded-xl text-sm font-bold transition-all border ${userSettings.stream === key ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/30' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
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
                            <span className="text-amber-500">{userSettings.dailyTarget} Hours</span>
                        </label>
                        <input 
                            type="range" 
                            min="1" max="16" step="1"
                            value={userSettings.dailyTarget}
                            onChange={(e) => setUserSettings({...userSettings, dailyTarget: parseInt(e.target.value)})}
                            className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
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
                        <button onClick={handleSaveSettings} className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-zinc-900 dark:bg-amber-600 hover:bg-zinc-800 dark:hover:bg-amber-500 transition-all shadow-xl flex items-center justify-center gap-2">
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