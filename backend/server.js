const express = require('express');
const http = require('http');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = require('./config/firebaseServiceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const connectDB = require('./config/db');
const { initIO } = require('./services/socketService');

// Initialize database
connectDB();

const app = express();
const server = http.createServer(app);

// Enable CORS and body parser
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Init socket.io
initIO(server);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/food', require('./routes/foodRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Basic health check
app.get('/', (req, res) => {
  res.send('BiteBridge API is running smoothly.');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error occurred' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`BiteBridge server running on port ${PORT}`);
});
