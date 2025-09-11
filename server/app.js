const express = require ('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db');
const path = require('path');

const faceRoutes = require('./routes/faceRoutes'); 
const taskRoutes = require('./routes/taskRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const dprRoutes = require('./routes/dprRoutes');
const siteRoutes = require('./routes/siteRoutes'); 

dotenv.config();  
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB Connection
connectDB();

// ✅ API routes first
app.use('/api', require('./routes/auth'));
app.use('/api', faceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/workers', require('./routes/workerRoutes'));
app.use('/api/dpr', dprRoutes);
app.use('/api/sites', siteRoutes);

// ✅ Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Serve React build
app.use(express.static(path.join(__dirname, 'public')));

// ⚡ Catch-all should be LAST
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
