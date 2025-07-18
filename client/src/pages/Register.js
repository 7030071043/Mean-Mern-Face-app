import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:5000/api/register', { email, password });
    alert('Registered successfully!');
  };

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
