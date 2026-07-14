require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { corsOptions, allowedOrigins } = require('./config/corsConfig');
const registerSocketHandlers = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

/* ─── Middleware ─── */
app.use(cors(corsOptions));
app.use(express.json());

/* ─── Socket.io ─── */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

registerSocketHandlers(io);

/* ─── Health check ─── */
app.get('/', (_req, res) => res.json({ status: 'ok', service: 'PeerDrop Signaling Server' }));
app.get('/health', (_req, res) => res.json({ status: 'healthy', uptime: process.uptime() }));

/* ─── Global error handler ─── */
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 2005;
server.listen(PORT, () => {
  console.log(`PeerDrop signaling server running on port ${PORT}`);
});