import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Youtube, Plus, Video, ArrowLeft, Clock, Trash2, Edit, Save, PlayCircle, ExternalLink, BookOpen, CheckCircle2, Play, Minus, AlertTriangle, X, Check, ChevronDown, RefreshCw, Zap } from 'lucide-react';
import { collection, doc, setDoc, onSnapshot, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';

const Videos = ({ db, user, appId, syllabus, progress, stream }) => {
  const [playlists, setPlaylists] = useState([]);
  
  // Add Form State
  const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistTotal, setNewPlaylistTotal] = useState(''); 
  const [newPlaylistSubject, setNewPlaylistSubject] = useState(''); // NEW: Subject Selection
  
  // Use ID to track selection
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  
  // Derive selected playlist
  const selectedPlaylist = useMemo(() => 
    playlists.find(p => p.id === selectedPlaylistId) || null
  , [playlists, selectedPlaylistId]);

  // Quick Log State
  const [isLogging, setIsLogging] = useState(false);
  const [playlistNotes, setPlaylistNotes] = useState('');

  // UI State
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null); 

  // Memoize collection ref
  const videoCollectionRef = useMemo(() => {
      return user ? collection(db, 'artifacts', appId, 'users', user.uid, 'videos') : null;
  }, [db, appId, user?.uid]);

  // --- Real-time Listeners ---
  useEffect(() => {
    if (!videoCollectionRef) return;
    const unsubPlaylists = onSnapshot(videoCollectionRef, (snapshot) => {
        const playlistsData = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(p => p.listId && p.name);  
        setPlaylists(playlistsData);
    }, (error) => console.error("Error fetching playlists:", error));
    return () => unsubPlaylists();
  }, [videoCollectionRef]);

  // Sync notes
  useEffect(() => {
      if (selectedPlaylist) {
          setPlaylistNotes(selectedPlaylist.notes || '');
      }
  }, [selectedPlaylistId, selectedPlaylist]); 

  // --- Helpers ---
  const getYouTubeListId = (url) => {
      try {
          const urlObj = new URL(url);
          return urlObj.searchParams.get('list');
      } catch (e) { return null; }
  };

  const getAvailableSubjects = () => {
      if (!syllabus || !stream || !syllabus[stream]) return [];
      return Object.keys(syllabus[stream]);
  };

  // --- Handlers ---
  const handleAddPlaylist = async (e) => {
    e.preventDefault();
    const listId = getYouTubeListId(newPlaylistUrl);

    if (listId && newPlaylistName.trim()) {
      const playlistId = listId; 
      
      const newPlaylist = {
        id: playlistId,
        listId: listId,
        url: newPlaylistUrl,
        name: newPlaylistName,
        subject: newPlaylistSubject, // NEW: Save Subject
        totalVideos: parseInt(newPlaylistTotal) || 0,
        watchedCount: 0,
        watchedIndices: [], 
        currentVideoIndex: 0, 
        createdAt: new Date().toISOString()
      };
      
      try {
        if(videoCollectionRef) {
            await setDoc(doc(videoCollectionRef, playlistId), newPlaylist);
            setNewPlaylistUrl('');
            setNewPlaylistName('');
            setNewPlaylistTotal('');
            setNewPlaylistSubject('');
        }
      } catch (err) {
          console.error("Error adding playlist:", err);
          alert("Failed to add playlist.");
      }
    } else {
      alert('Please enter a valid YouTube Playlist URL and a Name.');
    }
  };

  const handleRequestDelete = (playlistId, e) => {
    e.stopPropagation();
    setDeleteConfirmationId(playlistId);
  };

  const confirmDelete = async () => {
    if(videoCollectionRef && deleteConfirmationId) {
        await deleteDoc(doc(videoCollectionRef, deleteConfirmationId));
        if (selectedPlaylistId === deleteConfirmationId) setSelectedPlaylistId(null);
        setDeleteConfirmationId(null);
    }
  };

  const handleVideoClick = async (playlist, index, e) => {
      e.stopPropagation();
      if (!videoCollectionRef) return;

      const currentIndices = playlist.watchedIndices || [];
      const total = playlist.totalVideos || 0;
      
      if (!currentIndices.includes(index)) {
          const newIndices = [...currentIndices, index];
          const newCount = newIndices.length;
          let nextIndex = index + 1;
          if (total > 0 && nextIndex >= total) nextIndex = index;

          const playlistRef = doc(videoCollectionRef, playlist.id);
          await updateDoc(playlistRef, { 
              watchedIndices: newIndices,
              watchedCount: newCount,
              currentVideoIndex: nextIndex 
          });
      } else {
          const playlistRef = doc(videoCollectionRef, playlist.id);
          await updateDoc(playlistRef, { currentVideoIndex: index });
      }
  };

  const handleVideoDoubleClick = async (playlist, index, e) => {
      e.stopPropagation();
      if (!videoCollectionRef) return;
      const currentIndices = playlist.watchedIndices || [];
      if (currentIndices.includes(index)) {
          const newIndices = currentIndices.filter(i => i !== index);
          const newCount = newIndices.length;
          const playlistRef = doc(videoCollectionRef, playlist.id);
          await updateDoc(playlistRef, { watchedIndices: newIndices, watchedCount: newCount });
      }
  };

  const handleQuickLog = async (minutes) => {
      if (!user || !selectedPlaylist) return;
      setIsLogging(true);
      try {
        const today = new Date();
        const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'study_log', dateKey);
        
        const docSnap = await getDoc(docRef);
        let currentData = docSnap.exists() ? docSnap.data() : { hours: 0, sessions: [] };
        
        const hoursToAdd = minutes / 60;
        const newSession = {
            id: Date.now().toString(),
            subject: selectedPlaylist.subject || selectedPlaylist.name || 'Video Study', // Use playlist subject if available
            hours: hoursToAdd,
            notes: `Watched ${selectedPlaylist.name} (Quick Log)`,
            timestamp: new Date().toISOString()
        };

        const updatedSessions = [...(currentData.sessions || []), newSession];
        const newTotalHours = updatedSessions.reduce((sum, s) => sum + s.hours, 0);

        await setDoc(docRef, { hours: newTotalHours, sessions: updatedSessions, updatedAt: new Date().toISOString() });
        alert(`Logged ${minutes} mins for "${selectedPlaylist.name}"!`);
      } catch (err) { console.error("Error logging time:", err); } finally { setIsLogging(false); }
  };

  const handleSaveNotes = async () => {
       if(videoCollectionRef && selectedPlaylist) {
           await setDoc(doc(videoCollectionRef, selectedPlaylist.id), { notes: playlistNotes }, { merge: true });
       }
  };

  const handleResume = (e, playlist) => {
      e.stopPropagation();
      setSelectedPlaylistId(playlist.id);
  };

  // --- NEW: Syllabus Handling for Video View ---
  const toggleSyllabusItem = async (subject, topic, field) => {
    if (!user || !subject) return;
    
    // Construct the Deep Update for Firestore Map
    // We use dot notation 'subject.topic.field' to update nested fields without overwriting
    const docPath = `progress`; // The document ID inside 'syllabus' collection
    const sylRef = doc(db, 'artifacts', appId, 'users', user.uid, 'syllabus', docPath);

    try {
        // Read current state first to toggle boolean correctly
        const currentDone = progress?.[subject]?.[topic]?.done || false;
        const currentRev = progress?.[subject]?.[topic]?.rev || 0;

        let updateData = {};
        
        if (field === 'done') {
            updateData = { [`${subject}.${topic}.done`]: !currentDone };
        } else if (field === 'rev_inc') {
            updateData = { [`${subject}.${topic}.rev`]: currentRev + 1 };
        } else if (field === 'rev_dec') {
            updateData = { [`${subject}.${topic}.rev`]: Math.max(0, currentRev - 1) };
        }

        await updateDoc(sylRef, updateData).catch(async (err) => {
             // If document doesn't exist yet, we might need setDoc with merge
             if (err.code === 'not-found') {
                 // Fallback to manual object construction for first write
                 const newState = { ...progress };
                 if(!newState[subject]) newState[subject] = {};
                 if(!newState[subject][topic]) newState[subject][topic] = { done: false, rev: 0 };
                 
                 if(field === 'done') newState[subject][topic].done = !currentDone;
                 if(field === 'rev_inc') newState[subject][topic].rev = currentRev + 1;
                 
                 await setDoc(sylRef, newState);
             } else {
                 console.error(err);
             }
        });
    } catch (err) {
        console.error("Error updating syllabus:", err);
    }
  };

  // --- View: Single Playlist (Player) ---
  if (selectedPlaylist) {
    const startIndex = selectedPlaylist.currentVideoIndex || 0;
    const subjectData = (syllabus && stream && selectedPlaylist.subject) 
        ? syllabus[stream][selectedPlaylist.subject] 
        : null;

    return (
      <div className="animate-in fade-in duration-300 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSelectedPlaylistId(null)} className="flex items-center gap-2 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors">
            <ArrowLeft size={16} /> Back to Library
            </button>
            <div className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-full flex items-center gap-2">
                <span className="animate-pulse w-2 h-2 rounded-full bg-amber-500"></span>
                Now Playing: {selectedPlaylist.name} (Video {startIndex + 1})
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          
          {/* Main Player Column */}
          <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl dark:shadow-black/50 border border-zinc-200 dark:border-white/10 relative shrink-0">
               <iframe 
                    key={startIndex} 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed?listType=playlist&list=${selectedPlaylist.listId}&index=${startIndex+1}&modestbranding=1&rel=0`}
                    title={selectedPlaylist.name}
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    className="absolute inset-0"
                ></iframe>
            </div>
            
            <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-white/10 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{selectedPlaylist.name}</h2>
                    <div className="flex gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1"><Youtube size={12}/> {selectedPlaylist.subject || 'Uncategorized'}</span>
                        <span>•</span>
                        <a href={selectedPlaylist.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-amber-500 hover:underline">Open in YouTube <ExternalLink size={10}/></a>
                    </div>
                </div>
            </div>

            {/* NEW: Syllabus Section (Only if subject matches) */}
            {subjectData && (
                <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-white font-bold border-b border-zinc-100 dark:border-white/5 pb-2">
                        <ListChecks size={18} className="text-amber-500"/> 
                        <h3>{selectedPlaylist.subject} Syllabus</h3>
                        <span className="ml-auto text-xs font-normal text-zinc-400">Mark topics as you watch</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {subjectData.topics.map(topic => {
                             const tData = progress?.[selectedPlaylist.subject]?.[topic] || { done: false, rev: 0 };
                             return (
                                <div key={topic} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group border border-transparent hover:border-zinc-100 dark:hover:border-white/5">
                                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleSyllabusItem(selectedPlaylist.subject, topic, 'done')}>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${tData.done ? 'bg-amber-500 border-amber-500 text-white' : 'border-zinc-300 dark:border-zinc-600 text-transparent group-hover:border-amber-400'}`}>
                                            <Check size={10} strokeWidth={4} />
                                        </div>
                                        <span className={`text-xs font-medium transition-colors ${tData.done ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-300'}`}>{topic}</span>
                                    </div>
                                    {/* Mini Revision Counter */}
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-bold text-zinc-300 uppercase">Rev</span>
                                        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-white/10">
                                            <button onClick={() => toggleSyllabusItem(selectedPlaylist.subject, topic, 'rev_inc')} className="px-1.5 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                                <RefreshCw size={10} />
                                            </button>
                                            <span className="px-1 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">{tData.rev || 0}</span>
                                        </div>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                </div>
            )}
          </div>

          {/* Sidebar: Study Tools */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Progress Checkboxes */}
             <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-white font-bold">
                    <CheckCircle2 size={18} className="text-emerald-500"/> 
                    <h3>Track Videos</h3>
                </div>
                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                    {Array.from({ length: selectedPlaylist.totalVideos || 0 }).map((_, i) => {
                        const isChecked = (selectedPlaylist.watchedIndices || []).includes(i);
                        const isCurrent = i === (selectedPlaylist.currentVideoIndex || 0);
                        return (
                            <button 
                                key={i}
                                onClick={(e) => handleVideoClick(selectedPlaylist, i, e)}
                                onDoubleClick={(e) => handleVideoDoubleClick(selectedPlaylist, i, e)}
                                title={`Video ${i + 1}`}
                                className={`
                                    aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all border select-none
                                    ${isChecked 
                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                        : isCurrent 
                                            ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/30'
                                            : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-white/5 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                                    }
                                `}
                            >
                                {isChecked ? <Check size={14} strokeWidth={3} /> : i + 1}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Quick Logger Card */}
            <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-white font-bold">
                    <Clock size={18} className="text-amber-500"/> 
                    <h3>Quick Log Study</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleQuickLog(30)} disabled={isLogging} className="p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 border border-zinc-200 dark:border-white/5 rounded-xl text-sm font-bold transition-all disabled:opacity-50">+ 30 Mins</button>
                    <button onClick={() => handleQuickLog(60)} disabled={isLogging} className="p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 border border-zinc-200 dark:border-white/5 rounded-xl text-sm font-bold transition-all disabled:opacity-50">+ 1 Hour</button>
                </div>
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col h-64">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
                        <BookOpen size={18} className="text-indigo-500"/> 
                        <h3>Notes</h3>
                    </div>
                    <button onClick={handleSaveNotes} className="text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-200 transition-colors">Save</button>
                </div>
                <textarea 
                    className="flex-1 w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5 rounded-xl p-3 text-sm text-zinc-700 dark:text-zinc-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="E.g., 'Stopped at 14:20 in Video 3'..."
                    value={playlistNotes} 
                    onChange={(e) => {
                        setPlaylistNotes(e.target.value);
                    }}
                />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- View: Library (List of Playlists) ---
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      
      {/* Header + Add Form Combo */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
        <div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
            Video Library
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">Curate playlists & track your progress.</p>
        </div>

        {/* Compact Add Form */}
        <form onSubmit={handleAddPlaylist} className="bg-white dark:bg-zinc-900/50 p-2 pl-3 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row gap-2 items-center w-full xl:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Youtube className="text-zinc-400 shrink-0" size={18} />
                <input
                    type="text"
                    value={newPlaylistUrl}
                    onChange={(e) => setNewPlaylistUrl(e.target.value)}
                    placeholder="Playlist URL"
                    className="w-full sm:w-40 bg-transparent text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400"
                />
            </div>
            <div className="w-px h-6 bg-zinc-200 dark:bg-white/10 hidden sm:block"></div>
            
            {/* NEW: Subject Selector in Add Form */}
            <div className="relative w-full sm:w-40 group">
                <select 
                    value={newPlaylistSubject}
                    onChange={(e) => setNewPlaylistSubject(e.target.value)}
                    className="w-full appearance-none bg-transparent text-sm font-bold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer pl-2 pr-6 py-1"
                >
                    <option value="" disabled>Select Subject</option>
                    {getAvailableSubjects().map(sub => (
                        <option key={sub} value={sub} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200">{sub}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"/>
            </div>

            <div className="w-px h-6 bg-zinc-200 dark:bg-white/10 hidden sm:block"></div>
            <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Alias Name"
                className="w-full sm:w-32 bg-transparent px-2 text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400"
            />
            <div className="w-px h-6 bg-zinc-200 dark:bg-white/10 hidden sm:block"></div>
            <input
                type="number"
                value={newPlaylistTotal}
                onChange={(e) => setNewPlaylistTotal(e.target.value)}
                placeholder="# Vids"
                min="0"
                className="w-full sm:w-16 bg-transparent px-2 text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400"
            />
            <button
                type="submit"
                className="w-full sm:w-auto bg-amber-500 text-white p-2 rounded-xl font-bold flex items-center justify-center hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 shrink-0"
                disabled={!newPlaylistUrl || !newPlaylistName || !user}
            >
                <Plus size={18} />
            </button>
        </form>
      </div>

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {playlists.length === 0 ? (
          <div className="col-span-full text-center py-20 rounded-3xl bg-zinc-50 dark:bg-zinc-900/30 border-2 border-dashed border-zinc-200 dark:border-white/10">
            <Video size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <h3 className="text-lg font-bold text-zinc-500 dark:text-zinc-400">No playlists yet.</h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              Add a playlist above to get started.
            </p>
          </div>
        ) : (
          playlists.map(playlist => {
            const watched = playlist.watchedCount || 0;
            const total = playlist.totalVideos || 0;
            const percentage = total > 0 ? Math.round((watched / total) * 100) : 0;
            const currentIndex = playlist.currentVideoIndex || 0;

            return (
              <div 
                key={playlist.id} 
                onClick={() => setSelectedPlaylistId(playlist.id)}
                className="group bg-white dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-sm border border-zinc-200 dark:border-white/10 overflow-hidden cursor-pointer hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-md transition-all relative flex flex-col"
              >
                {/* Uniform Icon Container with Text */}
                <div className="aspect-[16/9] bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 relative flex flex-col items-center justify-center p-6 text-center group-hover:from-zinc-200 dark:group-hover:from-zinc-800 transition-colors">
                    <div className="mb-2 p-3 bg-white dark:bg-white/10 rounded-full shadow-sm text-amber-500">
                        <Youtube size={24} />
                    </div>
                    <h3 className="font-black text-zinc-900 dark:text-white text-lg leading-tight line-clamp-2 uppercase tracking-tight">
                        {playlist.name}
                    </h3>
                    {playlist.subject && (
                        <div className="mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 dark:bg-black/40 text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                            {playlist.subject}
                        </div>
                    )}
                    
                    {/* Resume Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button 
                            onClick={(e) => handleResume(e, playlist)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                        >
                            <Play size={16} fill="currentColor"/> 
                            Resume #{currentIndex + 1}
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                {total > 0 && (
                    <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                )}

                {/* Card Actions */}
                <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                            <Clock size={12}/>
                            <span>{playlist.notes ? 'Notes saved' : 'No notes'}</span>
                         </div>
                         <button 
                            onClick={(e) => handleRequestDelete(playlist.id, e)}
                            className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    {/* Progress Text */}
                    <div className="flex items-center justify-between bg-zinc-50 dark:bg-white/5 p-2 rounded-xl">
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 px-1">
                            {watched} <span className="text-zinc-300 dark:text-zinc-600">/</span> {total > 0 ? total : '-'}
                        </span>
                        <div className="flex gap-1">
                             {/* Mini checkboxes preview (first 3) */}
                             {Array.from({ length: Math.min(3, total) }).map((_, i) => (
                                 <div key={i} className={`w-2 h-2 rounded-full ${(playlist.watchedIndices || []).includes(i) ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}></div>
                             ))}
                             {total > 3 && <div className="text-[8px] text-zinc-400 leading-none">...</div>}
                        </div>
                    </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Custom Delete Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-xs p-6 rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 text-center animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Delete Playlist?</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">This will remove it from your library permanently.</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setDeleteConfirmationId(null)} 
                        className="flex-1 py-3 rounded-xl font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete} 
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// Simple Icon Import for new Syllabus features
const ListChecks = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 6h10"/><path d="M10 12h10"/><path d="M10 18h10"/><path d="M4 6h1"/><path d="M4 12h1"/><path d="M4 18h1"/></svg>
);

export default Videos;