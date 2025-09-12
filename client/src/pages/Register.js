import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
const API_URL = process.env.REACT_APP_API_URL;

const handleRegister = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post(`${API_URL}/register`, { email, password });
    console.log("✅ Registered:", res.data);
    alert('Registered successfully!');
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
    alert('Registration failed!');
  }



  return (
    <div className="container d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ minWidth: '350px' }}>
        <h3 className="text-center text-success mb-3">Register</h3>
        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <input className="form-control" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mb-3">
            <input type="password" className="form-control" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-success w-100">Register</button>
        </form>
        <p className="mt-3 text-center">
          Already have an account? <Link to="/login" className="text-decoration-none text-primary">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
