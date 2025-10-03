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

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/workers');
        const data = await res.json();
        const map = {};
        data.forEach(worker => {
          map[worker.email] = { name: worker.name, photo: downloadImg };
        });
        setWorkers(map);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWorkers();
  }, []);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/sites');
        const data = await res.json();
        const map = {};
        data.forEach(site => (map[site._id] = site.name));
        setSites(map);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSites();
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/attendance/by-date?date=${selectedDate}`);
      const data = await res.json();
      setRecords(data);

      const counts = {};
      data.forEach(r => (counts[r.email] = (counts[r.email] || 0) + 1));
      const summary = Object.keys(counts).map(email => ({ email, count: counts[email] }));
      setChartData(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, fetchAttendance]);

  const downloadExcel = () => {
    const url = `http://localhost:5000/api/attendance/export${selectedDate ? `?date=${selectedDate}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div className="attendance-container">
      <h3 className="page-title">📆 Attendance History</h3>

      <div className="filter-panel">
        <div className="filter-item">
          <label>Select Date:</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <button className="btn btn-success btn-download" onClick={downloadExcel}>⬇️ Download Excel</button>
      </div>

      <div className="main-content">
        {/* Left: Historical Records & Chart */}
        <div className="left-panel">
          <div className="records-section card">
            {loading ? (
              <p className="loading-text">Loading attendance records...</p>
            ) : (
              <ul className="records-list">
                {records.length ? records.map((rec, idx) => {
                  const worker = workers[rec.email] || {};
                  const siteName = sites[rec.siteId] || rec.siteName || 'Unknown';
                  return (
                    <li key={idx} className="record-item">
                      <div className="record-left">
                        <img src={worker.photo || '/default-avatar.png'} alt={worker.name} className="avatar" />
                        <div>
                          <strong>{worker.name || '👤 Unknown'}</strong>
                          <small>{rec.email} | {siteName}</small>
                        </div>
                      </div>
                      <span className="record-time">{new Date(rec.timestamp).toLocaleString()}</span>
                    </li>
                  );
                }) : <li className="no-records">No records to display.</li>}
              </ul>
            )}
          </div>

          <div className="chart-section card mt-4">
            <h4>📊 Worker Attendance Summary</h4>
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
 
        
      </div>
    </div>
  );
};

export default AttendanceHistory;
