import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MainLayout.css'; // custom styles

const MainLayout = () => {
  const navigate = useNavigate();

  const handleNav = (path) => {
    navigate(path);
  };

  return (
    <div className="main-layout d-flex flex-column align-items-center justify-content-center min-vh-100">
      <div className="text-center mb-5">
        <h2 className="fw-bold text-primary">🏗️ Construction Site Management</h2>
        <p className="text-muted">Manage sites, workers, tasks, attendance & DPRs</p>
      </div>

      <div className="features-grid">
        <div className="feature-card" onClick={() => handleNav('/siteRoutes')}>
          <span className="icon">📊</span>
          <h5>Dashboard</h5>
          <p>View site attendance, tasks & DPR summary</p>
        </div>

        <div className="feature-card" onClick={() => handleNav('/workers')}>
          <span className="icon">👷</span>
          <h5>Workers</h5>
          <p>Manage worker profiles and records</p>
        </div>

        <div className="feature-card" onClick={() => handleNav('/save-descriptor')}>
          <span className="icon">🧠</span>
          <h5>Face Recognition</h5>
          <p>Register & match workers with AI</p>
        </div>

        <div className="feature-card" onClick={() => handleNav('/attendanceRoutes')}>
          <span className="icon">📅</span>
          <h5>Attendance</h5>
          <p>Check daily & historical attendance</p>
        </div>

        <div className="feature-card" onClick={() => handleNav('/taskRoutes')}>
          <span className="icon">✅</span>
          <h5>Tasks</h5>
          <p>Assign and track work progress</p>
        </div>

        <div className="feature-card" onClick={() => handleNav('/dprRoutes')}>
          <span className="icon">📝</span>
          <h5>DPR</h5>
          <p>Generate daily progress reports</p>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
