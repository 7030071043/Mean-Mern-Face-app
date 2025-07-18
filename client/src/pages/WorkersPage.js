import React, { useState, useEffect, useRef } from 'react';

const WorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', photo: null });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  const fetchWorkers = async () => {
    const res = await fetch('http://localhost:5000/api/workers');
    const data = await res.json();
    setWorkers(data);
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);
    if (form.photo) formData.append('photo', form.photo);

    const url = editId
      ? `http://localhost:5000/api/workers/${editId}`
      : 'http://localhost:5000/api/workers';
    const method = editId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      body: formData,
    });

    setForm({ name: '', email: '', photo: null });
    setEditId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchWorkers();
  };

  const handleEdit = (worker) => {
    setForm({ name: worker.name, email: worker.email, photo: null });
    setEditId(worker._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure to delete this worker?')) {
      await fetch(`http://localhost:5000/api/workers/${id}`, {
        method: 'DELETE',
      });
      fetchWorkers();
    }
  };

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container p-4">
      <h3 className="mb-4">👷 Workers Management</h3>

      <form
        onSubmit={handleSubmit}
        className="border p-3 mb-4 rounded shadow-sm"
      >
        <h5>{editId ? '✏️ Edit Worker' : '➕ Add Worker'}</h5>
        <input
          type="text"
          name="name"
          className="form-control mb-2"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          className="form-control mb-2"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="file"
          name="photo"
          className="form-control mb-2"
          onChange={handleChange}
          ref={fileInputRef}
        />
        <button className="btn btn-primary">
          {editId ? 'Update' : 'Add'}
        </button>
      </form>

      <input
        type="text"
        className="form-control mb-3"
        placeholder="🔍 Search by name or email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <h5>📄 Worker List</h5>
      <ul className="list-group">
        {filteredWorkers.length > 0 ? (
          filteredWorkers.map((worker) => (
            <li
              key={worker._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <strong>{worker.name}</strong> <br />
                <small>{worker.email}</small>
              </div>
              <div className="d-flex align-items-center">
                <img
                  src={
                    worker.photo
                      ? `http://localhost:5000/uploads/${worker.photo}`
                      : '/default-user.png'
                  }
                  alt="profile"
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: 'cover',
                    borderRadius: '50%',
                    marginRight: 10,
                  }}
                />
                <button
                  className="btn btn-sm btn-outline-secondary me-2"
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
  );
};

export default WorkersPage;
