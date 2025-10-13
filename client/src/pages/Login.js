import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaHardHat } from 'react-icons/fa';

const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://mean-mern-face-app-pbyy.onrender.com");

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/main');
    } catch (err) {
      alert('Invalid credentials');
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        fontFamily: "'Montserrat', sans-serif",
        background: `url("./construction-bg.jpg") no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      {/* Overlay for slight darkening */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 1,
        }}
      ></div>

      <div
        className="card p-4 shadow-lg"
        style={{
          minWidth: '380px',
          borderRadius: '15px',
          backgroundColor: 'rgba(248,249,250,0.95)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Hard Hat Icon */}
        <div className="text-center mb-3">
          <FaHardHat size={50} color="#ffc107" />
        </div>

        <h3 className="text-center text-dark mb-4" style={{ fontWeight: '700' }}>
          Community Login
        </h3>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control rounded-pill border-warning border-2"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control rounded-pill border-warning border-2"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn w-100"
            style={{
              backgroundColor: '#ffc107',
              color: '#1a1a1a',
              fontWeight: '600',
              borderRadius: '25px',
            }}
          >
            Login
          </button>
        </form>

        {/* Footer */}
        <div className="mt-4 text-center text-muted" style={{ fontSize: '0.9rem' }}>
          © 2025 Community Construction 
        </div>
      </div>
    </div>
  );
};

export default Login;
