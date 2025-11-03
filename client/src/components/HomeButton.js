// src/components/HomeButton.js
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HomeButton.css";

const HomeButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Show only on these pages
  const allowedPaths = [
    "/siteRoutes",
    "/workers",
    "/save-descriptor",
    "/attendanceRoutes",
    "/taskRoutes",
    "/dprRoutes",
  ];

  if (!allowedPaths.includes(location.pathname)) return null;

  const handleHomeClick = () => {
    navigate("/main");
    // ✅ Wait a bit to let navigation complete before refreshing
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  return (
    <button
      className="home-floating-btn"
      onClick={handleHomeClick}
      title="Go to Home"
    >
      <i className="fas fa-home"></i>
    </button>
  );
};

export default HomeButton;
