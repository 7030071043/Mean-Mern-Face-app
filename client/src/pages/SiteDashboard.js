import React, { useEffect, useState } from "react";
import downloadImg from "../Assets/download.png";
import "./SiteDashboard.css";

// Automatically detect API URL
const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://mean-mern-face-app-pbyy.onrender.com");

const SiteDashboard = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dprs, setDprs] = useState([]);
  const [dprFilterDate, setDprFilterDate] = useState("");
  const [workers, setWorkers] = useState([]);
  const [newSite, setNewSite] = useState({ name: "", location: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [siteEngineers, setSiteEngineers] = useState([]);

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
  const addNewSite = async () => {
    if (!newSite.name || !newSite.location) {
      alert("Please fill in all required fields!");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/sites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSite),
      });

      if (!res.ok) throw new Error("Failed to add site");

      const data = await res.json();
      alert("✅ Site added successfully!");
      setNewSite({ name: "", location: "", description: "" });
      fetchSites(); // refresh site list
    } catch (err) {
      console.error("❌ Error adding site:", err);
      alert("Failed to add site!");
    } finally {
      setLoading(false);
    }
  };

 const formatDateYYYYMMDD = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
  const fetchSiteWorkers = async () => {
    try {
      const data = await fetchJsonArray(`${API_URL}/workers`);
      const map = {};
      data.forEach((worker) => {
        map[worker.email] = { name: worker.name, photo: downloadImg };
      });
      setWorkers(map);
    } catch (err) {
      console.error("❌ Couldn't fetch workers:", err);
    }
  };

  const fetchSites = async () => {
    const data = await fetchJsonArray(`${API_URL}/sites`);
    setSites(data);
  };

  const fetchSiteDetails = async (siteId) => {
    setLoading(true);
    const [a, t, d] = await Promise.all([
      fetchJsonArray(`${API_URL}/attendance/site/${siteId}/today`),
      fetchJsonArray(`${API_URL}/tasks/site/${siteId}`),
      fetchJsonArray(`${API_URL}/dpr/site/${siteId}`),
    ]);
    setAttendance(a);
    setTasks(t);
    setDprs(d);
    const engineers = [...new Set(t.map((task) => task.assignedBy))];
    setSiteEngineers(engineers);
    setLoading(false);
  };

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchSiteDetails(selectedSite);
      fetchSiteWorkers(selectedSite);
    }
  }, [selectedSite]);

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">🏗 Site Dashboard</h2>

      {/* Add New Site */}
      <div className="card new-site-card">
        <h4>➕ Add New Site</h4>
        <div className="site-form">
          <input
            placeholder="Site Name"
            value={newSite.name}
            onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
          />
          <input
            placeholder="Location"
            value={newSite.location}
            onChange={(e) => setNewSite({ ...newSite, location: e.target.value })}
          />
          <input
            placeholder="Description"
            value={newSite.description}
            onChange={(e) => setNewSite({ ...newSite, description: e.target.value })}
          />
          <button className="mt-4" onClick={addNewSite}>
            Add Site
          </button>
        </div>
      </div>

      {/* Site Selector */}
      <div className="card select-site-card">
        <label>Select Site:</label>
        <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)}>
          <option value="">-- Choose a Site --</option>
          {sites.map((site) => (
            <option key={site._id} value={site._id}>
              {site.name}
            </option>
          ))}
        </select>

        {siteEngineers.length > 0 && (
          <div className="engineer-section">
            <strong>👷 Site Engineer{siteEngineers.length > 1 ? "s" : ""}:</strong>
            <div className="engineer-badges">
              {siteEngineers.map((name, idx) => (
                <span key={idx} className="engineer-badge">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && <p className="loading">Loading site data...</p>}

      {/* Site Details */}
      {!loading && selectedSite && (
        <>
          {/* Attendance Section */}
          <div className="card attendance-card">
            <h4>👷 Today's Attendance</h4>
            {attendance.length === 0 ? (
              <p className="text-muted text-center">No attendance found for today.</p>
            ) : (
              <ul>
                {attendance.map((rec, idx) => {
                  const worker = workers[rec.email] || {};
                  return (
                    <li key={idx} className="attendance-item">
                      <div className="attendance-info">
                        <img
                          src={worker.photo || "/default-avatar.png"}
                          alt={worker.name || "Unknown"}
                          className="worker-img"
                        />
                        <div>
                          <span className="worker-name">{worker.name || "Unknown Worker"}</span>
                          <span className="worker-email">{rec.email}</span>
                        </div>
                      </div>
                      <div className="attendance-time">
                        {new Date(rec.timestamp).toLocaleTimeString()}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Tasks */}
          <div className="card task-card">
            <h4>🧠 Task Summary</h4>
            <div className="task-stats">
              <div className="task-box completed">
                ✅ Completed: {tasks.filter((t) => t.status === "completed").length}
              </div>
              <div className="task-box pending">
                ⏳ Pending: {tasks.filter((t) => t.status !== "completed").length}
              </div>
            </div>
          </div>

          {/* 📊 DPR Section */}
          <div className="card dpr-card">
            <h4>📊 Daily Progress Report</h4>

            <div className="dpr-filter">
              <label htmlFor="dprDate">📅 Select Date:</label>
              <input
                id="dprDate"
                type="date"
                value={dprFilterDate}
                onChange={(e) => setDprFilterDate(e.target.value)}
              />
            </div>

            {(() => {
              const selectedDate = dprFilterDate
                ? new Date(dprFilterDate)
                : new Date(); // default = today
              const filteredDprs = dprs.filter(
                (d) =>
                  new Date(d.date).toDateString() === selectedDate.toDateString()
              );

              return filteredDprs.length > 0 ? (
                <>
                  <ul className="dpr-list">
                    {filteredDprs.map((dpr, i) => (
                      <li key={i} className="dpr-item">
                        <strong>{dpr.projectName}</strong> — {dpr.todayWork}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="download-btn"
                    onClick={() => {
                      if (!selectedSite) return alert('Please select a site first.');
                      const dateParam = formatDateYYYYMMDD(dprFilterDate || new Date());
                      const url = `${API_URL}/dpr/export?date=${encodeURIComponent(dateParam)}&siteId=${encodeURIComponent(selectedSite)}`;
                      // open in a new tab
                      window.open(url, '_blank');
                    }}
                  >
                    ⬇️ Download Excel
                  </button>
                </>
              ) : (
                <p className="text-muted text-center">
                  No DPR available for {selectedDate.toLocaleDateString()}.
                </p>
              );
            })()}
          </div>

        </>
      )}
    </div>
  );
};

export default SiteDashboard;
