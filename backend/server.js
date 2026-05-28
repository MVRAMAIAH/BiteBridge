const express = require('express');
const http = require('http');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env variable:', error.message);
  }
} else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Replace literal '\n' with actual newlines in private key
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
} else {
  try {
    serviceAccount = require('./config/firebaseServiceAccountKey.json');
  } catch (error) {
    console.warn('Firebase service account key file not found. Falling back to environment variables.');
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.error('CRITICAL ERROR: Firebase Admin SDK could not be initialized due to missing credentials.');
}

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
