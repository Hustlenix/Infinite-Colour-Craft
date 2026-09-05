import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const app = express();
app.use(express.json({ limit: '15mb' }));

interface CollabUser {
  id: string;
  name: string;
  color: string;
  tab?: string;
  cursor?: { x: number; y: number };
}

interface CollabClient extends WebSocket {
  roomId?: string;
  user?: CollabUser;
  isAlive?: boolean;
}

// In-memory room manager for real-time collaboration
const rooms = new Map<string, Set<CollabClient>>();

function getRoomUsers(roomId: string): CollabUser[] {
  const clients = rooms.get(roomId);
  if (!clients) return [];
  const users: CollabUser[] = [];
  for (const client of clients) {
    if (client.user) {
      users.push(client.user);
    }
  }
  return users;
}

function broadcastToRoom(roomId: string, message: unknown, sender?: CollabClient) {
  const clients = rooms.get(roomId);
  if (!clients) return;
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    roomsActive: rooms.size,
    timestamp: Date.now(),
  });
});

async function startServer() {
  const server = http.createServer(app);

  // WebSocket Server for Real-Time Collaboration
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: CollabClient) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());

        if (msg.type === 'join') {
          const roomId = msg.roomId || 'lobby';
          ws.roomId = roomId;
          ws.user = msg.user || {
            id: 'user_' + Math.random().toString(36).slice(2, 8),
            name: 'Alchemist',
            color: '#FFD700',
          };

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
          }
          rooms.get(roomId)!.add(ws);

          // Send current presence list to newly joined user
          const users = getRoomUsers(roomId);
          ws.send(JSON.stringify({
            type: 'presence',
            users,
            roomId,
          }));

          // Notify others in room of new user
          broadcastToRoom(roomId, {
            type: 'user_joined',
            user: ws.user,
            users,
          }, ws);
          return;
        }

        if (!ws.roomId) return;
        const roomId = ws.roomId;

        // Broadcast room actions (strokes, tile moves, fusions, reactions, cursors)
        if (msg.type === 'cursor') {
          if (ws.user) {
            ws.user.cursor = { x: msg.x, y: msg.y };
            ws.user.tab = msg.tab;
          }
          broadcastToRoom(roomId, {
            type: 'cursor',
            user: ws.user,
            x: msg.x,
            y: msg.y,
            tab: msg.tab,
          }, ws);
        } else if (
          msg.type === 'stroke' ||
          msg.type === 'clear_canvas' ||
          msg.type === 'tile_move' ||
          msg.type === 'tile_fuse' ||
          msg.type === 'tile_spawn' ||
          msg.type === 'tile_delete' ||
          msg.type === 'color_discovered' ||
          msg.type === 'reaction' ||
          msg.type === 'chat'
        ) {
          broadcastToRoom(roomId, {
            ...msg,
            sender: ws.user,
          }, ws);
        }
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    });

    ws.on('close', () => {
      if (ws.roomId && rooms.has(ws.roomId)) {
        const roomSet = rooms.get(ws.roomId)!;
        roomSet.delete(ws);
        if (roomSet.size === 0) {
          rooms.delete(ws.roomId);
        } else {
          broadcastToRoom(ws.roomId, {
            type: 'user_left',
            user: ws.user,
            users: getRoomUsers(ws.roomId),
          });
        }
      }
    });
  });

  // Keep-alive ping interval
  const interval = setInterval(() => {
    wss.clients.forEach((wsClient) => {
      const client = wsClient as CollabClient;
      if (client.isAlive === false) {
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  // Vite middleware in development or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Infinite Colour Craft server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
