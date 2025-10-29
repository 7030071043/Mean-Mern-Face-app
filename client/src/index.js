import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './pages/MainLayout';
import Register from './pages/Register';
import FaceRecognitionPage from './pages/FaceRecognitionPage';
import WorkersPage from './pages/WorkersPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import TaskPanel from './pages/TaskPanel';
import AttendanceHistory from './pages/AttendanceHistory';
import GenerateDPR from './pages/GenerateDPR';
import SiteDashboard from './pages/SiteDashboard';  
import HomeButton from './components/HomeButton';
import "@fortawesome/fontawesome-free/css/all.min.css";


const App = () => (
  <BrowserRouter>
    {/* ✅ Place HomeButton OUTSIDE Routes */}

    <HomeButton />
    <Routes>
      {/* ✅ Redirect root "/" to "/login" */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* ✅ Login & Register routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} /> 

      {/* ✅ Main Layout */}
      <Route path="/main" element={<MainLayout />} />

      {/* ✅ Face Recognition */}
      <Route path="/save-descriptor" element={<FaceRecognitionPage />} />
    
      {/* ✅ Site Dashboard */}
      <Route path="/siteRoutes" element={<SiteDashboard />} />

      {/* ✅ Workers management */}
      <Route path="/workers" element={<WorkersPage />} />

      {/* ✅ Task Panel */}
      <Route path="/taskRoutes" element={<TaskPanel />} />

      {/* ✅ Attendance History */}
      <Route path="/attendanceRoutes" element={<AttendanceHistory />} />

      {/* ✅ DPR Generation */}
      <Route path="/dprRoutes" element={<GenerateDPR />} />
    </Routes>
  </BrowserRouter>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
