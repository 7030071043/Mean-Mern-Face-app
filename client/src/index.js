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


const App = () => (
  <BrowserRouter>
    <Routes>
      { /* ✅ Redirect root "/" to "/login" */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* ✅ Login route */}
      <Route path="/login" element={<Login />} />
      
      {/* ✅ Register route */}
      <Route path="/register" element={<Register />} /> 

      <Route path="/main" element={<MainLayout />}/>

  
      <Route path="/save-descriptor" element={<FaceRecognitionPage />}/>
    
      {/* ✅ SiteDashboard */}
       { <Route path="/siteRoutes" element={<SiteDashboard />} /> }

      {/* ✅ Workers management */}
      <Route path="/workers" element={<WorkersPage />} />

      <Route path ="/taskRoutes" element={<TaskPanel/>}/>
     
     <Route path='/attendanceRoutes' element={<AttendanceHistory/>}/>

     <Route path='/dprRoutes' element={<GenerateDPR/>}/>

    </Routes>
  </BrowserRouter>
);

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
