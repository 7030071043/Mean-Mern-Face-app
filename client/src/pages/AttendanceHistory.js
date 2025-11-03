import React, { useState, useEffect, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import downloadImg from "../Assets/download.png";
import "./AttendanceHistory.css";

const AttendanceHistory = ({ liveAttendance = [] }) => {
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState({});
  const [sites, setSites] = useState({});
  const [chartData, setChartData] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Fetch workers
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch(`${API_URL}/workers`);
        const data = await res.json();
        const map = {};
        data.forEach(
          (worker) =>
            (map[worker.email] = {
              name: worker.name,
              photo: worker.photo || downloadImg,
            })
        );
        setWorkers(map);
      } catch (err) {
        console.error("❌ Error fetching workers:", err);
      }
    };
    fetchWorkers();
  }, [API_URL]);

  // Fetch sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch(`${API_URL}/sites`);
        const data = await res.json();
        const map = {};
        data.forEach((site) => (map[site._id] = site.name));
        setSites(map);
      } catch (err) {
        console.error("❌ Error fetching sites:", err);
      }
    };
    fetchSites();
  }, [API_URL]);

  // Fetch attendance for selected date
  const fetchAttendance = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/attendance/by-date?date=${selectedDate}`
      );
      const data = await res.json();
      setRecords(data);

      // Prepare chart data
      const counts = {};
      data.forEach((r) => (counts[r.email] = (counts[r.email] || 0) + 1));
      const summary = Object.keys(counts).map((email) => ({
        email,
        count: counts[email],
      }));
      setChartData(summary);
    } catch (err) {
      console.error("❌ Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, API_URL]);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, fetchAttendance]);

  const downloadExcel = () => {
    const url = `${API_URL}/attendance/export${
      selectedDate ? `?date=${selectedDate}` : ""
    }`;
    window.open(url, "_blank");
  };

  return (
    <div className="attendance-container container py-4">
      <h3 className="page-title text-center mb-4">📅 Attendance History</h3>

      {/* Filter Panel */}
      <div className="filter-panel d-flex flex-wrap gap-3 mb-4 align-items-end justify-content-center">
        <div>
          <label className="form-label fw-semibold">Select Date:</label>
          <input
            type="date"
            className="form-control shadow-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <button className="btn btn-success px-3" onClick={downloadExcel}>
          ⬇️ Download Excel
        </button>
        <button
          className="btn btn-outline-secondary px-3"
          onClick={() => setSelectedDate("")}
        >
          Clear
        </button>
      </div>

      {/* Records Section */}
      <div className="records-section card p-3 mb-4">
        {loading ? (
          <p className="text-center text-muted my-4">Loading records...</p>
        ) : records.length ? (
          <ul className="list-group list-group-flush">
            {records.map((rec, idx) => {
              const worker = workers[rec.email] || {};
              const siteName = sites[rec.siteId] || rec.siteName || "Unknown";
              return (
                <li
                  key={`${rec.email}-${idx}`}
                  className="list-group-item d-flex justify-content-between align-items-center flex-wrap py-2"
                >
                  <div className="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden">
                    <img
                      src={worker.photo || downloadImg}
                      alt={worker.name}
                      onError={(e) => {
                        e.target.src = downloadImg;
                      }}
                      className="worker-photo"
                    />
                    <div className="text-truncate" style={{ minWidth: 0 }}>
                      <strong className="d-block text-dark text-truncate">
                        {worker.name || "👤 Unknown"}
                      </strong>
                      <small className="text-muted d-block text-truncate">
                        {rec.email} | {siteName}
                      </small>
                    </div>
                  </div>
                  <span className="record-time text-nowrap">
                    {new Date(rec.timestamp).toLocaleTimeString()}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-center text-muted py-3">
            No attendance records available.
          </p>
        )}
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="chart-section card p-3">
          <h5 className="mb-3 text-center fw-semibold">
            📊 Worker Attendance Summary
          </h5>
          <Bar
            data={{
              labels: chartData.map(
                (d) => workers[d.email]?.name || d.email
              ),
              datasets: [
                {
                  label: "Attendance Count",
                  data: chartData.map((d) => d.count),
                  backgroundColor: "rgba(33, 150, 243, 0.7)",
                  borderColor: "rgba(33, 150, 243, 1)",
                  borderWidth: 1,
                  borderRadius: 6,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: {
                  display: true,
                  text: `Attendance Summary (${selectedDate || "All"})`,
                  font: { size: 14, weight: "600" },
                },
              },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
