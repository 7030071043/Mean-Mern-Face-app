import React, { useState, useEffect } from "react";
import "./TaskPanel.css";

const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://mean-mern-face-app-pbyy.onrender.com");

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const TaskPanel = () => {
  const [assignedBy, setAssignedBy] = useState("");
  const [siteId, setSiteId] = useState("");
  const [sites, setSites] = useState([]);
  const [email, setEmail] = useState("");
  const [task, setTask] = useState("");
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [listening, setListening] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [language, setLanguage] = useState("en-IN");

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch(`${API_URL}/sites`);
        const data = await res.json();
        setSites(data);
      } catch (err) {
        console.error("❌ Failed to fetch sites:", err);
      }
    };
    fetchSites();
  }, []);

  const fetchTasks = async () => {
    if (!email) return;
    try {
      let query = `?email=${email}`;
      if (selectedDate) query += `&date=${selectedDate}`;
      if (siteId) query += `&siteId=${siteId}`;

      const res = await fetch(`${API_URL}/tasks${query}`);
      const data = await res.json();
      setAssignedTasks(data);
    } catch (err) {
      console.error("❌ Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [email, selectedDate, siteId]);

  const assignTask = async () => {
    if (!siteId) return alert("Please select a site.");
    if (!assignedBy.trim()) return alert("Enter your name.");
    if (!email.trim()) return alert("Enter a valid worker email.");
    if (!task.trim()) return alert("Task cannot be empty.");

    try {
      const res = await fetch(`${API_URL}/tasks/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          assignedBy,
          assignedTo: email,
          task,
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert("❌ " + data.error);

      setTask("");
      setEmail("");
      setSiteId("");
      setAssignedBy("");
      fetchTasks();
    } catch (err) {
      console.error("❌ Failed to assign task:", err);
    }
  };

  const completeTask = async (id) => {
    try {
      await fetch(`${API_URL}/tasks/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: id }),
      });
      fetchTasks();
    } catch (err) {
      console.error("❌ Failed to complete task:", err);
    }
  };

  const handleVoiceInput = () => {
    if (!recognition) return alert("Voice recognition not supported.");
    recognition.lang = language;
    recognition.start();
    setListening(true);

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      setTask((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  return (
    <div className="container py-4 task-panel-container">
      <div className="card shadow-lg border-0 p-4">
        <h4 className="text-primary mb-4 fw-bold">
          📋 Assign Work (Site Engineer)
        </h4>

        {listening && (
          <div className="alert alert-info py-2 small">
            🎤 Listening... Speak your task.
          </div>
        )}

        <div className="row g-4">
          {/* Left Side */}
          <div className="col-lg-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Site Engineer Name"
                value={assignedBy}
                onChange={(e) => setAssignedBy(e.target.value)}
              />
              <label>👷 Site Engineer Name</label>
            </div>

            <div className="form-floating mb-3">
              <select
                className="form-select"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
              >
                <option value="">-- Select Site --</option>
                {sites.map((site) => (
                  <option key={site._id} value={site._id}>
                    {site.name}
                  </option>
                ))}
              </select>
              <label>🏗 Select Site</label>
            </div>

            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Worker Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>📧 Worker Email</label>
            </div>

            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Describe the task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleVoiceInput}
              >
                🎤
              </button>
            </div>

            <div className="form-floating mb-3">
              <select
                className="form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en-IN">English</option>
                <option value="hi-IN">Hindi</option>
                <option value="mr-IN">Marathi</option>
              </select>
              <label>🌐 Voice Input Language</label>
            </div>

            <button className="btn btn-primary w-100 mb-3" onClick={assignTask}>
              ➕ Assign Task
            </button>

            <div className="form-floating">
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <label>📅 Filter by Date</label>
            </div>
          </div>

          {/* Right Side */}
          <div className="col-lg-6">
            <div className="card assigned-tasks-card shadow-sm p-3">
              <h5 className="text-secondary fw-semibold mb-3">
                🛠 Assigned Tasks
              </h5>
              <ul className="list-group list-group-flush">
                {assignedTasks.length > 0 ? (
                  assignedTasks.map((t) => (
                    <li
                      key={t._id}
                      className="list-group-item d-flex justify-content-between align-items-start flex-column flex-md-row"
                    >
                      <div className="flex-grow-1">
                        <strong>{t.task}</strong>
                        <br />
                        <small className="text-muted">
                          By {t.assignedBy} •{" "}
                          {sites.find((s) => s._id === t.siteId)?.name ||
                            t.siteId}
                        </small>
                      </div>
                      <div className="mt-2 mt-md-0">
                        <span
                          className={`badge ${
                            t.status === "done"
                              ? "bg-success"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {t.status}
                        </span>
                        {t.status !== "done" && (
                          <button
                            className="btn btn-sm btn-outline-success ms-2"
                            onClick={() => completeTask(t._id)}
                          >
                            ✔
                          </button>
                        )}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="list-group-item text-center text-muted">
                    No tasks found for this email.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPanel;
