import React, { useState, useEffect, useRef } from 'react';
import Webcam from "react-webcam";
import './WorkersPage.css';

// 🌍 Auto-detect API base
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

const WorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', photo: null, status: 'active' });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ Fetch workers
  const fetchWorkers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/workers`);
      if (!res.ok) throw new Error('Failed to fetch workers');
      const data = await res.json();
      setWorkers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching workers:", err);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  // ✅ Handle Input
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

  // ✅ Capture Photo
  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "worker-photo.jpg", { type: "image/jpeg" });
        setForm(prev => ({ ...prev, photo: file }));
        setShowCamera(false);
      });
  };

  // ✅ Add or Edit Worker
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('status', form.status);
    if (form.photo) formData.append('photo', form.photo);

    const url = editId
      ? `${API_BASE_URL}/workers/${editId}`
      : `${API_BASE_URL}/workers`;
    const method = editId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, body: formData });
      if (!res.ok) throw new Error('Failed to save worker');
      await fetchWorkers();
      setForm({ name: '', email: '', photo: null, status: 'active' });
      setEditId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error("❌ Error saving worker:", err);
    }
  };

  // ✅ Edit Worker
  const handleEdit = (worker) => {
    setForm({ name: worker.name, email: worker.email, photo: null, status: worker.status || 'active' });
    setEditId(worker._id);
  };

  // ✅ Delete Worker
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure to delete this worker?')) {
      try {
        await fetch(`${API_BASE_URL}/workers/${id}`, { method: 'DELETE' });
        fetchWorkers();
      } catch (err) {
        console.error("❌ Error deleting worker:", err);
      }
    }
  };

  // ✅ Search + Filter
  const filteredWorkers = workers
    .filter((w) =>
      w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((w) => activeTab === 'all' || w.status === activeTab);

  return (
    <div className="workers-page container py-4">
      <h2 className="mb-4 page-title">👷 Workers Management</h2>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {['all', 'active', 'inactive'].map(tab => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'all' ? 'All Workers' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      {/* Worker Form */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">{editId ? '✏️ Edit Worker' : '➕ Add Worker'}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <select
                  name="status"
                  className="form-select"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="col-12">
                <input
                  type="file"
                  name="photo"
                  className="form-control"
                  onChange={handleChange}
                  ref={fileInputRef}
                />
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm mt-2"
                  onClick={() => setShowCamera(!showCamera)}
                >
                  {showCamera ? "Close Camera" : "📸 Capture with Camera"}
                </button>
              </div>
            </div>

            {showCamera && (
              <div className="mt-3 camera-box">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={320}
                  height={240}
                  videoConstraints={{ facingMode: "user" }}
                />
                <button
                  type="button"
                  className="btn btn-success mt-2"
                  onClick={capturePhoto}
                >
                  ✅ Capture
                </button>
              </div>
            )}

            <button className="btn btn-primary mt-3">
              {editId ? 'Update Worker' : 'Add Worker'}
            </button>
          </form>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        className="form-control mb-3"
        placeholder="🔍 Search by name or email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Worker List */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">📄 Worker List</h5>
          <ul className="list-group worker-list">
            {filteredWorkers.length > 0 ? (
              filteredWorkers.map((worker) => (
                <li
                  key={worker._id}
                  className="list-group-item d-flex flex-wrap justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center mb-2 mb-md-0">
                    <img
                      src={
                        worker.photo
                          ? `${API_BASE_URL}/uploads/${worker.photo}`
                          : '/default-user.png'
                      }
                      alt="profile"
                      style={{
                        width: 45,
                        height: 45,
                        objectFit: 'cover',
                        borderRadius: '50%',
                        marginRight: 12,
                      }}
                    />
                    <div>
                      <strong>{worker.name}</strong> <br />
                      <small className="text-muted">{worker.email}</small>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleEdit(worker)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(worker._id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className="list-group-item text-muted">No workers found.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorkersPage;
