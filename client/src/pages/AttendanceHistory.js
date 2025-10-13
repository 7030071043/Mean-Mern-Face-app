// client/src/pages/AttendanceHistory.js
import React, { useState, useEffect, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import downloadImg from '../Assets/download.png';
import './AttendanceHistory.css';

const AttendanceHistory = ({ liveAttendance = [] }) => {
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState({});
  const [sites, setSites] = useState({});
  const [chartData, setChartData] = useState([]);

  // Base API URL: dynamically switch between localhost and deployed backend
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch all workers
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/workers`);
        const data = await res.json();
        const map = {};
        data.forEach(worker => {
          map[worker.email] = { name: worker.name, photo: worker.photo || downloadImg };
        });
        setWorkers(map);
      } catch (err) {
        console.error('❌ Error fetching workers:', err);
      }
    };
    fetchWorkers();
  }, [API_URL]);

  // Fetch all sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch(`${API_URL}/api/sites`);
        const data = await res.json();
        const map = {};
        data.forEach(site => (map[site._id] = site.name));
        setSites(map);
      } catch (err) {
        console.error('❌ Error fetching sites:', err);
      }
    };
    fetchSites();
  }, [API_URL]);

  // Fetch attendance for selected date
  const fetchAttendance = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/attendance/by-date?date=${selectedDate}`);
      const data = await res.json();
      setRecords(data);

      // Prepare chart data
      const counts = {};
      data.forEach(r => (counts[r.email] = (counts[r.email] || 0) + 1));
      const summary = Object.keys(counts).map(email => ({ email, count: counts[email] }));
      setChartData(summary);
    } catch (err) {
      console.error('❌ Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, API_URL]);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, fetchAttendance]);

  // Merge live attendance if provided
  useEffect(() => {
    if (liveAttendance.length > 0) {
      setRecords(prev => [...prev, ...liveAttendance]);
      const counts = {};
      [...records, ...liveAttendance].forEach(r => (counts[r.email] = (counts[r.email] || 0) + 1));
      const summary = Object.keys(counts).map(email => ({ email, count: counts[email] }));
      setChartData(summary);
    }
  }, [liveAttendance]);

  const downloadExcel = () => {
    const url = `${API_URL}/api/attendance/export${selectedDate ? `?date=${selectedDate}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div className="attendance-container container py-4">
      <h3 className="page-title text-center mb-4">📆 Attendance History</h3>

      <div className="filter-panel d-flex flex-wrap gap-2 mb-4 align-items-end">
        <div className="filter-item d-flex flex-column">
          <label>Select Date:</label>
          <input type="date" className="form-control" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        </div>
        <button className="btn btn-success" onClick={downloadExcel}>⬇️ Download Excel</button>
        <button className="btn btn-secondary" onClick={() => setSelectedDate('')}>Clear Date</button>
      </div>

      <div className="main-content row">
        {/* Left panel: Records and chart */}
        <div className="col-lg-6">
          <div className="records-section card p-3 mb-4">
            {loading ? (
              <p className="loading-text text-center">Loading attendance records...</p>
            ) : (
              <ul className="records-list list-group">
                {records.length ? records.map((rec, idx) => {
                  const worker = workers[rec.email] || {};
                  const siteName = sites[rec.siteId] || rec.siteName || 'Unknown';
                  return (
                    <li key={`${rec.email}-${idx}`} className="record-item list-group-item d-flex justify-content-between align-items-center flex-wrap">
                      <div className="record-left d-flex align-items-center gap-2">
                        <img src={worker.photo || downloadImg} alt={worker.name} className="avatar rounded-circle" />
                        <div>
                          <strong>{worker.name || '👤 Unknown'}</strong>
                          <small className="d-block">{rec.email} | {siteName}</small>
                        </div>
                      </div>
                      <span className="record-time">{new Date(rec.timestamp).toLocaleString()}</span>
                    </li>
                  );
                }) : (
                  <li className="no-records list-group-item text-center text-muted">No records to display.</li>
                )}
              </ul>
            )}
          </div>

          <div className="chart-section card p-3">
            <h4 className="mb-3">📊 Worker Attendance Summary</h4>
            <Bar
              data={{
                labels: chartData.map(d => workers[d.email]?.name || d.email),
                datasets: [
                  {
                    label: 'Attendance Count',
                    data: chartData.map(d => d.count),
                    backgroundColor: 'rgba(33, 150, 243, 0.7)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: true },
                  title: {
                    display: true,
                    text: `Worker-wise Attendance (${selectedDate || 'Select a Date'})`,
                    font: { size: 16, weight: '600' },
                  },
                },
                scales: { y: { beginAtZero: true, precision: 0 } },
              }}
            />
          </div>
        </div>

        <div className="col-lg-6">
          {/* Reserved for future expansion: e.g., site filters or live feed */}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
