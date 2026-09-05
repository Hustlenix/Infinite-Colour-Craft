import React, { useState, useEffect } from 'react';
import { Users, Wifi, Sparkles, Share2 } from 'lucide-react';
import { collaborationService, CollabUser, RemoteReaction } from '../services/collaborationService';

interface CollabStatusBarProps {
  onOpenModal: () => void;
  isDarkMode?: boolean;
}

export const CollabStatusBar: React.FC<CollabStatusBarProps> = ({
  onOpenModal,
  isDarkMode = false,
}) => {
  const [users, setUsers] = useState<CollabUser[]>([]);
  const [room, setRoom] = useState<string>('alchemy-lounge');
  const [connMode, setConnMode] = useState<'supabase' | 'websocket' | 'disconnected'>('disconnected');
  const [floatingReactions, setFloatingReactions] = useState<RemoteReaction[]>([]);

  useEffect(() => {
    setUsers(collaborationService.getConnectedUsers());
    setRoom(collaborationService.getRoom());
    setConnMode(collaborationService.getConnectionMode());

    const handlePresence = (userList: CollabUser[]) => {
      setUsers(userList);
      setRoom(collaborationService.getRoom());
      setConnMode(collaborationService.getConnectionMode());
    };

    const handleReaction = (reaction: RemoteReaction) => {
      setFloatingReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2500);
    };

    collaborationService.on('presence', handlePresence);
    collaborationService.on('reaction', handleReaction);

    return () => {
      collaborationService.off('presence', handlePresence);
      collaborationService.off('reaction', handleReaction);
    };
  }, []);

  const totalCollaborators = users.length + 1; // peers + self

  return (
    <>
      {/* Floating Reactions Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map((r, idx) => {
          const posX = r.x ?? 30 + ((idx * 17) % 50);
          const posY = r.y ?? 70;
          return (
            <div
              key={r.id}
              className="absolute animate-bounce text-4xl flex flex-col items-center transition-all duration-1000"
              style={{
                left: `${Math.min(Math.max(posX, 5), 90)}%`,
                top: `${Math.min(Math.max(posY, 10), 80)}%`,
                animation: 'floatUp 2.5s ease-out forwards',
              }}
            >
              <span>{r.emoji}</span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shadow-md mt-1"
                style={{ backgroundColor: r.senderColor || '#F59E0B' }}
              >
                {r.senderName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Compact Collab Button & Pill */}
      <button
        onClick={onOpenModal}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm ${
          connMode !== 'disconnected'
            ? isDarkMode
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
            : isDarkMode
            ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
        }`}
        title={`Collaboration Room: #${room} (${connMode === 'supabase' ? 'Supabase Realtime' : 'Local Relay'})`}
      >
        <div className="relative flex items-center">
          <Users className="w-3.5 h-3.5" />
          <span
            className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full ${
              connMode !== 'disconnected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
            }`}
          />
        </div>
        <span className="hidden sm:inline font-mono">#{room}</span>
        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20">
          {totalCollaborators}
        </span>
      </button>
    </>
  );
};
