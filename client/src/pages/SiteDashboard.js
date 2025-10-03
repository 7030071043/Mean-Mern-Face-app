import React, { useEffect, useState } from "react";
 import downloadImg from '../Assets/download.png';


const SiteDashboard = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dprs, setDprs] = useState([]);
  const [dprFilterDate, setDprFilterDate] = useState("");
  const [workers, setWorkers] = useState([]);
  const [newSite, setNewSite] = useState({ name: "", location: "", description: "" });
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper to safely fetch arrays
  const fetchJsonArray = async (url) => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(`❌ Error fetching ${url}:`, err);
      return [];
    }
  };

  // Fetch workers with attendance today
  const fetchSiteWorkers = async (siteId) => {
    try {
       const res = await fetch('http://localhost:5000/api/workers');
             const data = await res.json();
             const map = {};
             data.forEach(worker => {
               map[worker.email] = {
                 name: worker.name,
                 photo: downloadImg  
               };
             });
             setWorkers(map);
           } catch (err) {
             console.error("❌ Couldn't fetch workers:", err);
           }
  };

  // Fetch all sites
  const fetchSites = async () => {
    const data = await fetchJsonArray("http://localhost:5000/api/sites");
    setSites(data);
  };

  // Fetch site details
  const fetchSiteDetails = async (siteId) => {
    setLoading(true);
    const [a, t, d] = await Promise.all([
      fetchJsonArray(`http://localhost:5000/api/attendance/site/${siteId}/today`),
      fetchJsonArray(`http://localhost:5000/api/tasks/site/${siteId}`),
      fetchJsonArray(`http://localhost:5000/api/dpr/site/${siteId}`),

    ]);
    setAttendance(a);
    setTasks(t);
    setDprs(d);
    setLoading(false);
  };

  // Fetch sites on mount
  useEffect(() => {
    fetchSites();
  }, []);
  
  // Fetch details when site is selected
  useEffect(() => {
    if (selectedSite) {
      fetchSiteDetails(selectedSite);
      fetchSiteWorkers(selectedSite);
    }
  }, [selectedSite]);
 
    

  // Handle creating a new site
  const handleCreateSite = async () => {
    if (!newSite.name || !newSite.location) return alert("Name and location are required");
    try {
      const res = await fetch("http://localhost:5000/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSite),
      });
      if (!res.ok) throw new Error("Failed to create site");
      alert("✅ Site created successfully!");
      setNewSite({ name: "", location: "", description: "" });
      fetchSites();
    } catch (err) {
      alert("❌ Error creating site");
      console.error(err);
    }
  };

  return (
    <div className="container py-4">
      <h3 className="mb-3">🏗 Site Dashboard</h3>

      {/* Add New Site */}
      <div className="card mb-4 p-3">
        <h5>Add New Site</h5>
        <div className="row g-2">
          <input
            className="form-control col-md-4"
            placeholder="Site Name"
            value={newSite.name}
            onChange={e => setNewSite({ ...newSite, name: e.target.value })}
          />
          <input
            className="form-control col-md-4"
            placeholder="Location"
            value={newSite.location}
            onChange={e => setNewSite({ ...newSite, location: e.target.value })}
          />
          <input
            className="form-control col-md-4"
            placeholder="Description"
            value={newSite.description}
            onChange={e => setNewSite({ ...newSite, description: e.target.value })}
          />
          <button className="btn btn-primary mt-2" onClick={handleCreateSite}>➕ Add Site</button>
        </div>
      </div>

      {/* Site Selector */}
      <div className="mb-3">
        <label>Select Site:</label>
        <select className="form-select" value={selectedSite} onChange={e => setSelectedSite(e.target.value)}>
          <option value="">-- Choose a Site --</option>
          {sites.map(site => <option key={site._id} value={site._id}>{site.name}</option>)}
        </select>
      </div>

      {loading && <p>Loading site data...</p>}

      {/* Site Details */}
      {selectedSite && !loading && (
        <>
      
          {/* Attendance Section in SiteDashboard */}
{attendance.length === 0 ? (
  <p className="text-gray-500">No attendance records found for today.</p>
) : (
  <ul className="list-group mt-3">
    {attendance.map((rec, idx) => {
      const worker = workers[rec.email] || {};

      return (
        <li
          key={idx}
          className="list-group-item d-flex justify-content-between align-items-center flex-wrap"
        >
          <div className="d-flex align-items-center gap-3">
            <img
              src={worker.photo || "/default-avatar.png"}
              alt={worker.name || "Unknown"}
              className="rounded-circle"
              style={{ width: 40, height: 40, objectFit: "cover" }}
            />
            <div>
              <strong>{worker.name || "👤 Unknown"}</strong>
              <br />
              <small className="text-muted">{rec.email}</small>
            </div>
          </div>
          <span>{new Date(rec.timestamp).toLocaleString()}</span>
        </li>
      );
    })}
  </ul>
)}





          {/* Tasks */}
          <div className="col-md-6 mb-4 mt-4">
            <h5>🧠 Task Summary</h5>
            <ul className="list-group">
              <li className="list-group-item">Completed: {tasks.filter(t => t.status === "completed").length}</li>
              <li className="list-group-item">Pending: {tasks.filter(t => t.status !== "completed").length}</li>
            </ul>
          </div>

          {/* DPR */}
          <div className="col-md-6 mb-4">
            <h5>📊 DPR Progress</h5>
            <div className="mb-2 d-flex align-items-center gap-2">
              <label className="form-label mb-0">📅 Filter DPR by Date:</label>
              <input type="date" className="form-control" value={dprFilterDate} onChange={e => setDprFilterDate(e.target.value)} />
            </div>
            <ul className="list-group">
              {dprs
                .filter(d => !dprFilterDate || new Date(d.date).toDateString() === new Date(dprFilterDate).toDateString())
                .map((dpr, i) => (
                  <li key={i} className="list-group-item">
                    <strong>{dpr.projectName}</strong> - {dpr.todayWork}
                  </li>
                ))
              }
              {!dprs.length && <li className="list-group-item text-muted">No DPRs found.</li>}
            </ul>
            <div className="d-flex justify-content-end mt-2">
              <button
                className="btn btn-success btn-sm"
                onClick={() => {
                  if (!dprFilterDate) return alert('Please select a date for DPR export');
                  window.open(`http://localhost:5000/api/dpr/export?date=${dprFilterDate}&siteId=${selectedSite}`, '_blank');
                }}
              >
                ⬇️ Download Excel
              </button>
            </div>
          </div>


        </>
      )}
    </div>
  );
};

export default SiteDashboard;
