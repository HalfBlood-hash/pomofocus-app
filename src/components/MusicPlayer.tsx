import React, { useState, useRef, useEffect } from 'react';
import { Track, PRESET_TRACKS } from '../utils/musicTracks';
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Upload,
  Link,
  ChevronDown,
  ChevronUp,
  X,
  Radio,
  Sparkles,
} from 'lucide-react';

interface MusicPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ isOpen, onClose }) => {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('pomofocus_custom_tracks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...PRESET_TRACKS, ...parsed];
      } catch (e) {
        return PRESET_TRACKS;
      }
    }
    return PRESET_TRACKS;
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('pomofocus_music_volume');
    return saved ? parseFloat(saved) : 0.6;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Custom URL input
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [showAddCustom, setShowAddCustom] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
    }

    const audio = audioRef.current;

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setErrorMsg('');
    };
    const handleError = () => {
      setIsLoading(false);
      setErrorMsg('Could not play track. It might be blocked or offline.');
      setIsPlaying(false);
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem('pomofocus_music_volume', volume.toString());
  }, [volume, isMuted]);

  // Load and play track
  const loadTrack = (index: number, autoPlay: boolean = true) => {
    if (!audioRef.current || !tracks[index]) return;
    setCurrentTrackIndex(index);
    setErrorMsg('');
    setIsLoading(true);

    audioRef.current.src = tracks[index].url;
    audioRef.current.load();

    if (autoPlay) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.warn('Playback error:', e);
          setIsPlaying(false);
          setIsLoading(false);
        });
    } else {
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src || audioRef.current.src === '') {
        loadTrack(currentTrackIndex, true);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn(err);
            loadTrack(currentTrackIndex, true);
          });
      }
    }
  };

  const nextTrack = () => {
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    loadTrack(nextIdx, isPlaying);
  };

  const prevTrack = () => {
    const prevIdx = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    loadTrack(prevIdx, isPlaying);
  };

  // Add custom URL track
  const handleAddCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const newTrack: Track = {
      id: 'custom-' + Date.now(),
      title: customTitle.trim() || 'Custom Stream ' + (tracks.length + 1),
      category: 'custom',
      url: customUrl.trim(),
      sourceType: 'stream',
    };

    const updated = [...tracks, newTrack];
    setTracks(updated);
    // Save only custom ones to local storage
    const customOnly = updated.filter((t) => t.category === 'custom');
    localStorage.setItem('pomofocus_custom_tracks', JSON.stringify(customOnly));

    setCustomUrl('');
    setCustomTitle('');
    setShowAddCustom(false);
    loadTrack(updated.length - 1, true);
  };

  // Upload local audio file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const objectUrl = URL.createObjectURL(file);

    const newTrack: Track = {
      id: 'local-' + Date.now(),
      title: '📁 ' + (file.name.replace(/\.[^/.]+$/, '')),
      category: 'local',
      url: objectUrl,
      sourceType: 'file',
    };

    const updated = [newTrack, ...tracks];
    setTracks(updated);
    loadTrack(0, true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <Music size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Focus Music & Sounds</h2>
              <p className="text-xs text-white/50">Curated radio stations, songs & local files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Playing Banner */}
        <div className="my-5 bg-gradient-to-br from-stone-800 to-stone-850 p-4 rounded-2xl border border-white/10 text-center relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[11px] uppercase tracking-wider font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
              {currentTrack.category} channel
            </span>
            <h3 className="font-bold text-base text-white truncate max-w-sm mx-auto">
              {currentTrack.title}
            </h3>

            {isLoading && (
              <p className="text-xs text-amber-400 animate-pulse mt-1">Connecting stream audio...</p>
            )}
            {errorMsg && (
              <p className="text-xs text-red-400 mt-1 font-medium">{errorMsg}</p>
            )}

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-5 mt-4">
              <button
                onClick={prevTrack}
                className="p-2.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 active:scale-90 transition-all"
                title="Previous Station/Track"
              >
                <SkipBack size={20} />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
              </button>

              <button
                onClick={nextTrack}
                className="p-2.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 active:scale-90 transition-all"
                title="Next Station/Track"
              >
                <SkipForward size={20} />
              </button>
            </div>

            {/* Volume bar */}
            <div className="flex items-center justify-center gap-3 mt-4 max-w-xs mx-auto">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-white/60 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-full accent-red-500 cursor-pointer h-1.5 bg-stone-700 rounded-lg appearance-none"
              />
              <span className="text-[11px] font-mono text-white/50 w-8">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Station / Track List */}
        <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
              Available Channels & Songs ({tracks.length})
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
                title="Play MP3 from your computer"
              >
                <Upload size={13} /> Local File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => setShowAddCustom(!showAddCustom)}
                className="text-[11px] font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
              >
                <Link size={13} /> Add URL
              </button>
            </div>
          </div>

          {/* Add custom URL form */}
          {showAddCustom && (
            <form onSubmit={handleAddCustomUrl} className="bg-stone-800 p-3 rounded-xl border border-white/10 mb-2 space-y-2">
              <input
                type="text"
                placeholder="Song or Station Title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-stone-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500"
              />
              <input
                type="url"
                placeholder="Direct Audio Stream / MP3 URL"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full bg-stone-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
                  className="text-xs text-white/60 hover:text-white px-2 py-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1 rounded-lg"
                >
                  Add Song
                </button>
              </div>
            </form>
          )}

          {tracks.map((track, idx) => {
            const isSelected = idx === currentTrackIndex;
            return (
              <div
                key={track.id}
                onClick={() => loadTrack(idx, true)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-red-500/20 border-red-500/50 text-white'
                    : 'bg-stone-800/50 hover:bg-stone-800 border-transparent text-white/70'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-red-500 text-white' : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {isSelected && isPlaying ? (
                      <span className="flex gap-0.5 items-end h-3">
                        <span className="w-0.5 bg-white h-3 animate-pulse"></span>
                        <span className="w-0.5 bg-white h-2 animate-pulse delay-75"></span>
                        <span className="w-0.5 bg-white h-3.5 animate-pulse delay-150"></span>
                      </span>
                    ) : (
                      <Radio size={12} />
                    )}
                  </div>
                  <span className="text-xs font-medium truncate">{track.title}</span>
                </div>

                <span className="text-[10px] uppercase font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded ml-2 shrink-0">
                  {track.category}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
          <span>Manual Control: Plays continuously across intervals</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

