
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./db');

dotenv.config();
const app = express();

// ✅ Allow JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Allowed Origins (Local + Netlify + Render)
const allowedOrigins = [
  "http://localhost:3000",
  "https://moonlit-stardust-37e1cf.netlify.app",
  "https://mean-mern-face-app-pbyy.onrender.com",
];

// ✅ CORS setup (handles API + static files)
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("❌ CORS blocked request from:", origin);
      callback(new Error("❌ Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// ✅ Serve uploaded images with CORS-safe headers
app.use(
  '/uploads',
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, 'uploads'))
);

// ✅ Database Connection
connectDB();

// ✅ ROUTES
const faceRoutes = require('./routes/faceRoutes'); 
const taskRoutes = require('./routes/taskRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const dprRoutes = require('./routes/dprRoutes');
const siteRoutes = require('./routes/siteRoutes'); 
const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/workerRoutes');

app.use(authRoutes);
app.use('/api', faceRoutes);
app.use('/tasks', taskRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/workers', workerRoutes);
app.use('/dpr', dprRoutes);
app.use('/sites', siteRoutes);

// ✅ Serve React Build (for Render or local)
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler Triggered 🚨');
  console.error('📍 Route:', req.method, req.originalUrl);
  console.error('📩 Body:', req.body);
  console.error('📎 Params:', req.params);
  console.error('🔍 Query:', req.query);
  console.error('❗ Error Message:', err.message);
  console.error('📜 Stack Trace:', err.stack);

  res.status(500).json({
    error: err.message || 'Internal Server Error',
    route: req.originalUrl,
  });
});

// ✅ Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Promise Rejection:');
  console.error(reason);
});

// ✅ Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:');
  console.error(err);
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

 