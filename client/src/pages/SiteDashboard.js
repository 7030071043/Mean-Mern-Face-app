import React, { useEffect, useState } from 'react';

const SiteDashboard = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dprs, setDprs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [newSite, setNewSite] = useState({ name: '', location: '', description: '' });

  const fetchSites = async () => {
    const res = await fetch('http://localhost:5000/api/sites');
    const data = await res.json();
    setSites(data);
  };

  const fetchSiteDetails = async (siteId) => {
    const endpoints = [
      `attendance/site/${siteId}`,
      `tasks/site/${siteId}`,
      `dpr/site/${siteId}`,
      `workers/site/${siteId}`,
    ];

    const [a, t, d, w] = await Promise.all(
      endpoints.map(endpoint => fetch(`http://localhost:5000/api/${endpoint}`).then(res => res.json()))
    );

    setAttendance(a);
    setTasks(t);
    setDprs(d);
    setWorkers(w);
  };

  useEffect(() => { fetchSites(); }, []);
  useEffect(() => { if (selectedSite) fetchSiteDetails(selectedSite); }, [selectedSite]);

  const handleCreateSite = async () => {
    if (!newSite.name || !newSite.location) return alert('Name and location are required');
    try {
      const res = await fetch('http://localhost:5000/api/sites', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSite),
      });
      if (!res.ok) throw new Error('Failed to create site');
      alert('✅ Site created successfully!');
      setNewSite({ name: '', location: '', description: '' });
      fetchSites();
    } catch (err) {
      alert('❌ Error creating site');
      console.error(err);
    }
  };

  return (
    <div className="container py-4">
      <h3 className="mb-3">🏗 Site Dashboard</h3>

      <div className="card mb-4 p-3">
        <h5>Add New Site</h5>
        <div className="row g-2">
          <input className="form-control col-md-4" placeholder="Site Name" value={newSite.name} onChange={(e) => setNewSite({ ...newSite, name: e.target.value })} />
          <input className="form-control col-md-4" placeholder="Location" value={newSite.location} onChange={(e) => setNewSite({ ...newSite, location: e.target.value })} />
          <input className="form-control col-md-4" placeholder="Description" value={newSite.description} onChange={(e) => setNewSite({ ...newSite, description: e.target.value })} />
          <button className="btn btn-primary mt-2" onClick={handleCreateSite}>➕ Add Site</button>
        </div>
      </div>

      <div className="mb-3">
        <label>Select Site:</label>
        <select className="form-select" value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)}>
          <option value="">-- Choose a Site --</option>
          {sites.map(site => <option key={site._id} value={site._id}>{site.name}</option>)}
        </select>
      </div>

      {selectedSite && (
        <>
          <div className="mt-4">
            <h5>📋 Attendance Records</h5>
            <ul className="list-group">
              {attendance.map((entry, index) => (
                <li className="list-group-item d-flex justify-content-between" key={entry._id}>
                  <span>{index + 1}. {entry.email}</span>
                  <span>{new Date(entry.checkIn).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <h5>🧠 Assigned Tasks</h5>
            <ul className="list-group">
              {tasks.map((task, i) => (
                <li key={i} className="list-group-item">
                  <strong>{task.assignedTo}</strong>: {task.description} <span className="badge bg-info ms-2">{task.status}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <h5>📒 DPRs</h5>
            <ul className="list-group">
              {dprs.map((dpr, i) => (
                <li key={i} className="list-group-item">
                  {dpr.date} - {dpr.todayWork} ({dpr.projectName})
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <h5>👷 Workers</h5>
            <ul className="list-group">
              {workers.map((w, i) => (
                <li key={i} className="list-group-item d-flex justify-content-between">
                  {w.name} <span>{w.email}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default SiteDashboard;
