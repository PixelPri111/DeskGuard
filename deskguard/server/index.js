const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initDB } = require('./db');
const deskRoutes = require('./routes/desks');
const adminRoutes = require('./routes/admin');
const bookingRoutes = require('./routes/bookings');
const { startSweeper } = require('./jobs/sweeper');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:4173',
      'https://deskguard-client.onrender.com'
    ],
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://deskguard-client.onrender.com'
  ]
}));
app.use(express.json());

async function main() {
  await initDB();

  app.use('/api/desks', deskRoutes(io));
  app.use('/api/admin', adminRoutes(io));
  app.use('/api/bookings', bookingRoutes(io));

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  startSweeper(io);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 DeskGuard server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
