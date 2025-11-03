import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // ✅ Make sure your backend URL includes /api
  // const API_URL = process.env.REACT_APP_API_URL; // e.g., https://mean-mern-face-app-pbyy.onrender.com/api
const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://mean-mern-face-app-pbyy.onrender.com");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Please fill in both email and password.');
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/api/register`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } } // ensures JSON payload
      );

      console.log("✅ Registered:", res.data);
      alert('Registered successfully!');
      navigate('/login'); // redirect to login after success
    } catch (err) {
      console.error("❌ Error:", err.response?.data || err.message);
      const message = err.response?.data?.message || 'Registration failed!';
      alert(message);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ minWidth: '350px' }}>
        <h3 className="text-center text-success mb-3">Register</h3>
        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-success w-100">Register</button>
        </form>
        <p className="mt-3 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-decoration-none text-primary">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
