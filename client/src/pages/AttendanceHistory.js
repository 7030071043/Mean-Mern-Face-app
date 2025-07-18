import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [workers, setWorkers] = useState({});
  const [summaryData, setSummaryData] = useState([]);

  const fetchWorkerMap = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/workers/all');
      const data = await res.json();
      const map = {};
      data.forEach((worker) => {
        map[worker.email] = worker.name;
      });
      setWorkers(map);
    } catch (err) {
      console.error("❌ Couldn't fetch workers list:", err);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/attendance/by-date?date=${selectedDate}`);
      const data = await res.json();
      setRecords(data);
      generateAiInsights(data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
    setLoading(false);
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/attendance/summary');
      const data = await res.json();
      setSummaryData(data);
    } catch (err) {
      console.error("❌ Couldn't fetch summary:", err);
    }
  };

  useEffect(() => {
    fetchWorkerMap();
    fetchSummary();
  }, []);

  useEffect(() => {
    if (selectedDate) fetchAttendance();
  }, [selectedDate]);

  const generateAiInsights = (data) => {
    if (!data || data.length === 0) {
      setAiSummary("⚠️ No attendance records found for the selected date.");
      speak("No attendance records found.");
      return;
    }

    const uniqueEmails = [...new Set(data.map((r) => r.email))];
    const summary = `✅ ${uniqueEmails.length} unique workers marked present on ${selectedDate}.`;
    setAiSummary(summary);
    speak(summary);
  };

  const speak = (text) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    synth.speak(utter);
  };

  const downloadExcel = () => {
    const url = `http://localhost:5000/api/attendance/export${selectedDate? `?date=${selectedDate}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div className="container mt-4 p-4 border rounded shadow-sm max-w-4xl mx-auto">
      <h3 className="mb-3">📆 Attendance History</h3>

      <div className="d-flex align-items-center gap-3 mb-3">
        <label className="form-label mb-0">Select Date:</label>
        <input
          type="date"
          className="form-control"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button className="btn btn-primary" onClick={fetchAttendance}>Fetch</button>
        <button className="btn btn-success" onClick={downloadExcel}>⬇️ Download Excel</button>
      </div>

      {aiSummary && (
        <div className="alert alert-info mt-2">🤖 AI Summary: {aiSummary}</div>
      )}

      {loading ? (
        <p>Loading attendance records...</p>
      ) : (
        <ul className="list-group mt-3">
          {records.length > 0 ? (
            records.map((rec, idx) => (
              <li key={idx} className="list-group-item d-flex justify-content-between">
                <span>
                  {workers[rec.email] || '👤 Unknown'} <br />
                  <small className="text-muted">{rec.email}</small>
                </span>
                <span>{new Date(rec.timestamp).toLocaleString()}</span>
              </li>
            ))
          ) : (
            <li className="list-group-item text-muted">No records to display.</li>
          )}
        </ul>
      )}

      <h4 className="mt-5">📊 Worker Attendance Summary</h4>
      <Bar
        data={{
          labels: summaryData.map((d) => d.name || d.email),
          datasets: [
            {
              label: 'Attendance Count',
              data: summaryData.map((d) => d.count),
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Worker-wise Total Attendance' },
          },
        }}
      />
    </div>
  );
};

export default AttendanceHistory;
