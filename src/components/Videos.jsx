import React, { useState, useEffect, useMemo } from 'react';
import { Youtube, Plus, Video, ArrowLeft, Clock, Trash2, Edit, Save, PlayCircle, ExternalLink, BookOpen, CheckCircle2, Play, Minus, AlertTriangle, X, Check } from 'lucide-react';
import { collection, doc, setDoc, onSnapshot, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';

const Videos = ({ db, user, appId }) => {
  const [playlists, setPlaylists] = useState([]);
  
  // Add Form State
  const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistTotal, setNewPlaylistTotal] = useState(''); 
  
  // Use ID to track selection so we always get the latest data from 'playlists' (Firestore)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  
  // Derive the selected playlist object from the live data
  const selectedPlaylist = useMemo(() => 
    playlists.find(p => p.id === selectedPlaylistId) || null
  , [playlists, selectedPlaylistId]);

  // Quick Log State
  const [isLogging, setIsLogging] = useState(false);
  const [playlistNotes, setPlaylistNotes] = useState('');

  // UI State
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null); 

  const videoCollectionRef = user ? collection(db, 'artifacts', appId, 'users', user.uid, 'videos') : null;

  // --- Real-time Listeners ---
  useEffect(() => {
    if (!videoCollectionRef) return;
    
    // Listen for playlists
    const unsubPlaylists = onSnapshot(videoCollectionRef, (snapshot) => {
        const playlistsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlaylists(playlistsData);
    });
    
    return () => {
        unsubPlaylists();
    };
  }, [videoCollectionRef]);

  // Sync local notes with selected playlist when it opens
  useEffect(() => {
      if (selectedPlaylist) {
          setPlaylistNotes(selectedPlaylist.notes || '');
      }
  }, [selectedPlaylistId]); // Only when ID changes, not every data update to avoid typing jitter

  // --- Helpers ---
  const getYouTubeListId = (url) => {
      try {
          const urlObj = new URL(url);
          return urlObj.searchParams.get('list');
      } catch (e) { return null; }
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
        totalVideos: parseInt(newPlaylistTotal) || 0,
        watchedCount: 0,
        watchedIndices: [], // Track specific videos completed
        currentVideoIndex: 0, // Track where to resume
        createdAt: new Date().toISOString()
      };
      
      try {
        if(videoCollectionRef) {
            await setDoc(doc(videoCollectionRef, playlistId), newPlaylist);
        }
        
        // Clear form explicitly after success
        setNewPlaylistUrl('');
        setNewPlaylistName('');
        setNewPlaylistTotal('');
      } catch (err) {
          console.error("Error adding playlist:", err);
          alert("Failed to add playlist. Please try again.");
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
      
      // If already checked, just set as current video (navigation).
      // If unchecked, mark as checked AND set as current video.
      if (!currentIndices.includes(index)) {
          const newIndices = [...currentIndices, index];
          const newCount = newIndices.length;
          
          const playlistRef = doc(videoCollectionRef, playlist.id);
          await updateDoc(playlistRef, { 
              watchedIndices: newIndices,
              watchedCount: newCount,
              currentVideoIndex: index 
          });
      } else {
          // Just navigate
          const playlistRef = doc(videoCollectionRef, playlist.id);
          await updateDoc(playlistRef, { currentVideoIndex: index });
      }
  };

  const handleVideoDoubleClick = async (playlist, index, e) => {
      e.stopPropagation();
      if (!videoCollectionRef) return;

      const currentIndices = playlist.watchedIndices || [];
      
      // Unmark if currently checked
      if (currentIndices.includes(index)) {
          const newIndices = currentIndices.filter(i => i !== index);
          const newCount = newIndices.length;

          const playlistRef = doc(videoCollectionRef, playlist.id);
          await updateDoc(playlistRef, { 
              watchedIndices: newIndices,
              watchedCount: newCount
          });
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
            subject: selectedPlaylist.name || 'Video Study',
            hours: hoursToAdd,
            notes: `Watched ${selectedPlaylist.name} (Quick Log)`,
            timestamp: new Date().toISOString()
        };

        const updatedSessions = [...(currentData.sessions || []), newSession];
        const newTotalHours = updatedSessions.reduce((sum, s) => sum + s.hours, 0);

        await setDoc(docRef, {
            hours: newTotalHours,
            sessions: updatedSessions,
            updatedAt: new Date().toISOString()
        });
        
        alert(`Logged ${minutes} mins for "${selectedPlaylist.name}"!`);
      } catch (err) {
          console.error("Error logging time:", err);
          alert("Failed to log time. Please try again.");
      } finally {
          setIsLogging(false);
      }
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

  // --- View: Single Playlist (Player) ---
  if (selectedPlaylist) {
    // Calculate the start index for the embed
    const startIndex = selectedPlaylist.currentVideoIndex || 0;

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
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl dark:shadow-black/50 border border-zinc-200 dark:border-white/10 relative">
               <iframe 
                    width="100%" 
                    height="100%" 
                    // index parameter controls which video starts. 
                    src={`https://www.youtube.com/embed?listType=playlist&list=${selectedPlaylist.listId}&index=${startIndex}&modestbranding=1&rel=0`}
                    title={selectedPlaylist.name}
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    className="absolute inset-0"
                ></iframe>
            </div>
            
            <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-white/10 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{selectedPlaylist.name}</h2>
                    <div className="flex gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1"><Youtube size={12}/> YouTube Playlist</span>
                        <span>•</span>
                        <a href={selectedPlaylist.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-amber-500 hover:underline">Open in YouTube <ExternalLink size={10}/></a>
                    </div>
                </div>
            </div>
          </div>

          {/* Sidebar: Study Tools */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Progress Checkboxes */}
             <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-white font-bold">
                    <CheckCircle2 size={18} className="text-emerald-500"/> 
                    <h3>Track Progress</h3>
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
                <div className="mt-3 text-xs text-center text-zinc-400">
                    Click to mark & play. <span className="text-red-400">Double-click to unmark.</span>
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

        {/* Compact Add Form - Top Right */}
        <form onSubmit={handleAddPlaylist} className="bg-white dark:bg-zinc-900/50 p-2 pl-3 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row gap-2 items-center w-full xl:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Youtube className="text-zinc-400 shrink-0" size={18} />
                <input
                    type="text"
                    value={newPlaylistUrl}
                    onChange={(e) => setNewPlaylistUrl(e.target.value)}
                    placeholder="Playlist URL"
                    className="w-full sm:w-48 bg-transparent text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400"
                />
            </div>
            <div className="w-px h-6 bg-zinc-200 dark:bg-white/10 hidden sm:block"></div>
            <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Name"
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

export default Videos;