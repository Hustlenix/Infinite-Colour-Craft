import React, { useState, useEffect } from 'react';
import {
  Users,
  Wifi,
  Database,
  Copy,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Sliders,
  ExternalLink,
  Flame,
  Palette,
  Share2
} from 'lucide-react';
import { collaborationService, CollabUser } from '../services/collaborationService';
import { getStoredSupabaseConfig, saveSupabaseConfig, isSupabaseConfigured } from '../services/supabaseClient';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

const PRESET_ROOMS = ['alchemy-lounge', 'pigment-lab', 'canvas-duo', 'creative-jam'];
const REACTION_EMOJIS = ['✨', '🧪', '🎨', '🔥', '🌈', '💎', '👑', '🚀'];

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = false,
}) => {
  const [userName, setUserName] = useState<string>('');
  const [userColor, setUserColor] = useState<string>('#3B82F6');
  const [roomInput, setRoomInput] = useState<string>('');
  const [connectedUsers, setConnectedUsers] = useState<CollabUser[]>([]);
  const [connMode, setConnMode] = useState<'supabase' | 'websocket' | 'disconnected'>('disconnected');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Supabase Configuration State
  const [showSupabaseConfig, setShowSupabaseConfig] = useState<boolean>(false);
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>('');
  const [supabaseSaved, setSupabaseSaved] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const user = collaborationService.getUser();
    setUserName(user.name);
    setUserColor(user.color);
    setRoomInput(collaborationService.getRoom());
    setConnectedUsers(collaborationService.getConnectedUsers());
    setConnMode(collaborationService.getConnectionMode());

    const stored = getStoredSupabaseConfig();
    setSupabaseUrl(stored.url);
    setSupabaseAnonKey(stored.anonKey);

    const handlePresence = (users: CollabUser[]) => {
      setConnectedUsers(users);
      setConnMode(collaborationService.getConnectionMode());
    };

    collaborationService.on('presence', handlePresence);
    return () => {
      collaborationService.off('presence', handlePresence);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateProfile = () => {
    if (userName.trim()) {
      collaborationService.updateUser(userName.trim(), userColor);
    }
  };

  const handleSwitchRoom = (newRoom: string) => {
    if (!newRoom.trim()) return;
    const cleanRoom = newRoom.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    setRoomInput(cleanRoom);
    collaborationService.setRoom(cleanRoom);
  };

  const handleCopyInviteLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', collaborationService.getRoom());
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    collaborationService.connect();
    setConnMode(collaborationService.getConnectionMode());
    setSupabaseSaved(true);
    setTimeout(() => setSupabaseSaved(false), 2500);
  };

  const handleSendReaction = (emoji: string) => {
    collaborationService.sendReaction(emoji);
  };

  const isSupabaseActive = connMode === 'supabase';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Real-Time Collaboration
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                    connMode !== 'disconnected'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {isSupabaseActive ? 'Supabase Realtime' : connMode === 'websocket' ? 'Local Relay' : 'Offline'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Co-paint on the live studio canvas and fuse pigments in real-time together.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Reaction Bar */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Reaction:
            </span>
            <div className="flex items-center gap-1.5">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="w-8 h-8 rounded-lg hover:scale-125 transition-transform active:scale-95 flex items-center justify-center text-lg hover:bg-white/10"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* User Profile */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Your Alchemist Profile
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={userColor}
                onChange={(e) => {
                  setUserColor(e.target.value);
                  collaborationService.updateUser(userName, e.target.value);
                }}
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-700 p-0.5 bg-transparent"
                title="Choose your cursor color"
              />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={handleUpdateProfile}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
                placeholder="Your artist nickname"
                className={`flex-1 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors outline-none ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500'
                }`}
              />
            </div>
          </div>

          {/* Room Selection & Sharing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Collab Room Code
              </label>
              <button
                onClick={handleCopyInviteLink}
                className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied Link!
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" /> Copy Invite Link
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSwitchRoom(roomInput)}
                placeholder="Enter room code..."
                className={`flex-1 px-3.5 py-2 rounded-xl text-sm font-mono border transition-colors outline-none ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500'
                }`}
              />
              <button
                onClick={() => handleSwitchRoom(roomInput)}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-sm"
              >
                Join Room
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs text-slate-400 mr-1 self-center">Popular:</span>
              {PRESET_ROOMS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleSwitchRoom(preset)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    roomInput === preset
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold'
                      : isDarkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  #{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Active Collaborators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider">
                Online in #{collaborationService.getRoom()} ({connectedUsers.length + 1})
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi className="w-3 h-3" /> Live
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border max-h-36 overflow-y-auto space-y-2 ${
                isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* You */}
              <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: userColor }}
                  />
                  <span className="font-semibold">{userName} (You)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                  Host
                </span>
              </div>

              {/* Peers */}
              {connectedUsers.map((peer) => (
                <div
                  key={peer.id}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: peer.color }}
                    />
                    <span>{peer.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {peer.tab ? `Tab: ${peer.tab}` : 'Active'}
                  </span>
                </div>
              ))}

              {connectedUsers.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">
                  No other alchemists in this room yet. Share your invite link above!
                </p>
              )}
            </div>
          </div>

          {/* Supabase Backend Integration Settings */}
          <div className="space-y-3 pt-2 border-t border-slate-700/50">
            <button
              type="button"
              onClick={() => setShowSupabaseConfig(!showSupabaseConfig)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Supabase Backend Configuration
                {isSupabaseConfigured() && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                    Connected
                  </span>
                )}
              </span>
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {showSupabaseConfig && (
              <form onSubmit={handleSaveSupabase} className="space-y-3 p-4 rounded-xl border border-slate-700 bg-slate-800/30 text-xs">
                <p className="text-slate-400">
                  Connect your own Supabase project for persistent real-time channels, presence tracking, and cloud broadcasts.
                </p>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Supabase Project URL</label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className={`w-full px-3 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Supabase Anon Key</label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className={`w-full px-3 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    Leave blank to use built-in local WebSocket relay.
                  </span>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {supabaseSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Saved!
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" /> Save & Reconnect
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between text-xs text-slate-400 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <span>Changes are synchronized live in real-time.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-bold bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
