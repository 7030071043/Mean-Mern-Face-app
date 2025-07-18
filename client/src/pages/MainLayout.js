import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MainLayout.css'; // Optional for custom styling

const MainLayout = () => {
  const navigate = useNavigate();

  const handleNav = (path) => {
    navigate(path);
  };

  return (
    <div className="main-layout">
      <h2 className="mb-4 text-primary">🏗️ Construction Site Management</h2>

      <div className="d-grid gap-3 col-6 mx-auto">
        <button className="btn btn-outline-primary" onClick={() => handleNav('/siteRoutes')}>
          📊 Dashboard
        </button>
        <button className="btn btn-outline-success" onClick={() => handleNav('/workers')}>
          👷 Workers Management
        </button>
        <button className="btn btn-outline-warning" onClick={() => handleNav('/save-descriptor')}>
          🧠 Face Recognition
        </button>
        <button className="btn btn-outline-info" onClick={() => handleNav('/attendanceRoutes')}>
          📅 Attendance History
        </button>
        <button className="btn btn-outline-secondary" onClick={() => handleNav('/taskRoutes')}>
          ✅ Task Assignment
        </button>
        <button className="btn btn-outline-dark" onClick={() => handleNav('/dprRoutes')}>
          📝 Generate DPR
        </button>
      </div>
    </div>
  );
};

export default MainLayout;
