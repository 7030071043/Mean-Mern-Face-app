const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./db');

// Routes
const faceRoutes = require('./routes/faceRoutes'); 
const taskRoutes = require('./routes/taskRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const dprRoutes = require('./routes/dprRoutes');
const siteRoutes = require('./routes/siteRoutes'); 
const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/workerRoutes');

dotenv.config();
const app = express();

// ✅ Secure CORS setup
const allowedOrigins = [
  "http://localhost:3000",             // local dev
  "https://moonlit-stardust-37e1cf.netlify.app"  // replace with your Netlify URL
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);  // allow request
    } else {
      callback(new Error("❌ Not allowed by CORS"));
    }
  },
  credentials: true, // if you ever use cookies/auth headers
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB Connection
connectDB();

// ✅ API routes
app.use('/api', authRoutes);
app.use('/api', faceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/dpr', dprRoutes);
app.use('/api/sites', siteRoutes);

// ✅ Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ❌ Removed React serving (Netlify handles frontend)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
