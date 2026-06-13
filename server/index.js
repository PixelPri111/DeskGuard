const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initDB } = require('./db');
const deskRoutes = require('./routes/desks');
const adminRoutes = require('./routes/admin');
const { startSweeper } = require('./jobs/sweeper');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

initDB();

app.use('/api/desks', deskRoutes(io));
app.use('/api/admin', adminRoutes(io));

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

startSweeper(io);

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 DeskGuard server running on http://localhost:${PORT}`);
});
