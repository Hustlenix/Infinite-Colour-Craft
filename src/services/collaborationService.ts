import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  tab?: string;
  cursor?: { x: number; y: number };
}

export interface RemoteStroke {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  opacity: number;
  tool: string;
  stencilMode?: string;
  blendMode?: string;
}

export interface RemoteTileMove {
  tileId: string;
  x: number;
  y: number;
  zIndex: number;
}

export interface RemoteTileFuse {
  parent1Id: string;
  parent2Id: string;
  resultingColorHex: string;
  resultingColorName: string;
  resultingColorEmoji: string;
  x: number;
  y: number;
}

export interface RemoteReaction {
  id: string;
  emoji: string;
  x?: number;
  y?: number;
  senderName: string;
  senderColor: string;
}

export type CollabEventType =
  | 'stroke'
  | 'clear_canvas'
  | 'tile_move'
  | 'tile_fuse'
  | 'tile_spawn'
  | 'tile_delete'
  | 'color_discovered'
  | 'reaction'
  | 'cursor'
  | 'presence';

type CollabEventHandler = (payload: any) => void;

const ALCHEMIST_TITLES = ['Sage', 'Artisan', 'Adept', 'Weaver', 'Crafter', 'Master', 'Chemist', 'Visionary'];
const ALCHEMIST_PIGMENTS = ['Cobalt', 'Amber', 'Viridian', 'Ochre', 'Crimson', 'Saffron', 'Indigo', 'Amethyst', 'Celeste'];
const ALCHEMIST_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

function generateRandomUser(): CollabUser {
  const pigment = ALCHEMIST_PIGMENTS[Math.floor(Math.random() * ALCHEMIST_PIGMENTS.length)];
  const title = ALCHEMIST_TITLES[Math.floor(Math.random() * ALCHEMIST_TITLES.length)];
  const color = ALCHEMIST_COLORS[Math.floor(Math.random() * ALCHEMIST_COLORS.length)];
  const id = 'user_' + Math.random().toString(36).slice(2, 9);
  return {
    id,
    name: `${pigment} ${title}`,
    color,
  };
}

class CollaborationService {
  private currentRoom = 'alchemy-lounge';
  private user: CollabUser;
  private supabaseChannel: RealtimeChannel | null = null;
  private ws: WebSocket | null = null;
  private listeners: Map<CollabEventType, Set<CollabEventHandler>> = new Map();
  private remoteUsers: Map<string, CollabUser> = new Map();
  private connectionMode: 'supabase' | 'websocket' | 'disconnected' = 'disconnected';
  private reconnectTimer: any = null;
  private isDestroyed = false;

  constructor() {
    // Load or generate user profile
    const saved = typeof window !== 'undefined' ? localStorage.getItem('icc_collab_user') : null;
    if (saved) {
      try {
        this.user = JSON.parse(saved);
      } catch {
        this.user = generateRandomUser();
      }
    } else {
      this.user = generateRandomUser();
      if (typeof window !== 'undefined') {
        localStorage.setItem('icc_collab_user', JSON.stringify(this.user));
      }
    }

    // Check URL params for room
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        this.currentRoom = roomParam.trim();
      }
    }
  }

  public init(roomName?: string) {
    if (roomName) {
      this.currentRoom = roomName;
    }
    this.connect();
  }

  public getUser(): CollabUser {
    return this.user;
  }

  public updateUser(name: string, color: string) {
    this.user.name = name;
    this.user.color = color;
    if (typeof window !== 'undefined') {
      localStorage.setItem('icc_collab_user', JSON.stringify(this.user));
    }
    this.broadcastPresence();
  }

  public getRoom(): string {
    return this.currentRoom;
  }

  public setRoom(newRoom: string) {
    if (this.currentRoom === newRoom) return;
    this.currentRoom = newRoom;
    this.disconnect();
    this.connect();
  }

  public getConnectedUsers(): CollabUser[] {
    return Array.from(this.remoteUsers.values());
  }

  public getConnectionMode(): 'supabase' | 'websocket' | 'disconnected' {
    return this.connectionMode;
  }

  public isConnected(): boolean {
    return this.connectionMode !== 'disconnected';
  }

  public on(event: CollabEventType, handler: CollabEventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  public off(event: CollabEventType, handler: CollabEventHandler) {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: CollabEventType, payload: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(payload);
        } catch (err) {
          console.error(`Error in collab handler for ${event}:`, err);
        }
      });
    }
  }

  public connect() {
    this.disconnect();

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      this.connectSupabase(supabase);
    } else {
      this.connectWebSocket();
    }
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.unsubscribe();
      } catch (err) {
        console.warn('Error unsubscribing supabase channel:', err);
      }
      this.supabaseChannel = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (err) {
        console.warn('Error closing websocket:', err);
      }
      this.ws = null;
    }

    this.connectionMode = 'disconnected';
    this.remoteUsers.clear();
    this.emit('presence', []);
  }

  // --- Supabase Realtime Provider ---
  private connectSupabase(supabase: any) {
    try {
      const channelName = `icc-collab-${this.currentRoom}`;
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: this.user.id },
        },
      });

      channel
        .on('broadcast', { event: 'collab_message' }, ({ payload }: { payload: any }) => {
          this.handleIncomingMessage(payload);
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users: CollabUser[] = [];
          Object.values(state).forEach((presences: any) => {
            presences.forEach((p: any) => {
              if (p.user && p.user.id !== this.user.id) {
                users.push(p.user);
                this.remoteUsers.set(p.user.id, p.user);
              }
            });
          });
          this.emit('presence', users);
        })
        .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: any }) => {
          newPresences.forEach((p: any) => {
            if (p.user && p.user.id !== this.user.id) {
              this.remoteUsers.set(p.user.id, p.user);
            }
          });
          this.emit('presence', Array.from(this.remoteUsers.values()));
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: any }) => {
          leftPresences.forEach((p: any) => {
            if (p.user) {
              this.remoteUsers.delete(p.user.id);
            }
          });
          this.emit('presence', Array.from(this.remoteUsers.values()));
        });

      channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          this.connectionMode = 'supabase';
          this.supabaseChannel = channel;
          await channel.track({ user: this.user });
          this.emit('presence', Array.from(this.remoteUsers.values()));
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('Supabase Realtime channel error, falling back to local relay...');
          this.connectWebSocket();
        }
      });
    } catch (err) {
      console.warn('Failed to start Supabase realtime:', err);
      this.connectWebSocket();
    }
  }

  // --- WebSocket Provider (Local / Relay) ---
  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.connectionMode = 'websocket';
        this.ws = ws;
        ws.send(
          JSON.stringify({
            type: 'join',
            roomId: this.currentRoom,
            user: this.user,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'presence') {
            const list: CollabUser[] = (msg.users || []).filter((u: CollabUser) => u.id !== this.user.id);
            this.remoteUsers.clear();
            list.forEach((u) => this.remoteUsers.set(u.id, u));
            this.emit('presence', list);
          } else if (msg.type === 'user_joined') {
            if (msg.user && msg.user.id !== this.user.id) {
              this.remoteUsers.set(msg.user.id, msg.user);
              this.emit('presence', Array.from(this.remoteUsers.values()));
            }
          } else if (msg.type === 'user_left') {
            if (msg.user) {
              this.remoteUsers.delete(msg.user.id);
              this.emit('presence', Array.from(this.remoteUsers.values()));
            }
          } else {
            this.handleIncomingMessage(msg);
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
      };

      ws.onclose = () => {
        if (this.connectionMode === 'websocket') {
          this.connectionMode = 'disconnected';
          this.remoteUsers.clear();
          this.emit('presence', []);
          if (!this.isDestroyed) {
            this.reconnectTimer = setTimeout(() => {
              this.connect();
            }, 3000);
          }
        }
      };
    } catch (err) {
      console.warn('Could not initialize WebSocket:', err);
    }
  }

  private handleIncomingMessage(msg: any) {
    if (!msg || !msg.type) return;

    if (msg.type === 'cursor') {
      if (msg.user && msg.user.id !== this.user.id) {
        this.remoteUsers.set(msg.user.id, {
          ...msg.user,
          cursor: { x: msg.x, y: msg.y },
          tab: msg.tab,
        });
      }
      this.emit('cursor', msg);
    } else if (msg.type === 'stroke') {
      this.emit('stroke', msg.stroke);
    } else if (msg.type === 'clear_canvas') {
      this.emit('clear_canvas', msg);
    } else if (msg.type === 'tile_move') {
      this.emit('tile_move', msg.data);
    } else if (msg.type === 'tile_fuse') {
      this.emit('tile_fuse', msg.data);
    } else if (msg.type === 'tile_spawn') {
      this.emit('tile_spawn', msg.data);
    } else if (msg.type === 'tile_delete') {
      this.emit('tile_delete', msg.data);
    } else if (msg.type === 'color_discovered') {
      this.emit('color_discovered', msg.color);
    } else if (msg.type === 'reaction') {
      this.emit('reaction', msg.reaction);
    }
  }

  private sendPayload(payload: any) {
    if (this.connectionMode === 'supabase' && this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'collab_message',
        payload,
      });
    } else if (this.connectionMode === 'websocket' && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  // --- Broadcast Action Methods ---
  public sendStroke(stroke: RemoteStroke) {
    this.sendPayload({
      type: 'stroke',
      stroke,
    });
  }

  public sendClearCanvas() {
    this.sendPayload({
      type: 'clear_canvas',
      timestamp: Date.now(),
    });
  }

  public sendTileMove(data: RemoteTileMove) {
    this.sendPayload({
      type: 'tile_move',
      data,
    });
  }

  public sendTileFuse(data: RemoteTileFuse) {
    this.sendPayload({
      type: 'tile_fuse',
      data,
    });
  }

  public sendTileSpawn(tile: any) {
    this.sendPayload({
      type: 'tile_spawn',
      data: tile,
    });
  }

  public sendTileDelete(tileId: string) {
    this.sendPayload({
      type: 'tile_delete',
      data: { tileId },
    });
  }

  public sendColorDiscovered(color: any) {
    this.sendPayload({
      type: 'color_discovered',
      color,
    });
  }

  public sendReaction(emoji: string, x?: number, y?: number) {
    const reaction: RemoteReaction = {
      id: Math.random().toString(36).slice(2),
      emoji,
      x,
      y,
      senderName: this.user.name,
      senderColor: this.user.color,
    };
    this.sendPayload({
      type: 'reaction',
      reaction,
    });
    // Also trigger locally for sender
    this.emit('reaction', reaction);
  }

  public sendCursor(x: number, y: number, tab?: string) {
    this.sendPayload({
      type: 'cursor',
      x,
      y,
      tab,
      user: this.user,
    });
  }

  private broadcastPresence() {
    if (this.connectionMode === 'supabase' && this.supabaseChannel) {
      this.supabaseChannel.track({ user: this.user });
    } else if (this.connectionMode === 'websocket' && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'join',
          roomId: this.currentRoom,
          user: this.user,
        })
      );
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.disconnect();
    this.listeners.clear();
  }
}

export const collaborationService = new CollaborationService();
