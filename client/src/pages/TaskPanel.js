import React, { useState, useEffect } from 'react';
import './TaskPanel.css';

// Voice recognition setup
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const TaskPanel = () => {
  const [assignedBy, setAssignedBy] = useState('');
  const [siteId, setSiteId] = useState('');
  const [sites, setSites] = useState([]);
  const [email, setEmail] = useState('');
  const [task, setTask] = useState('');
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [listening, setListening] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [language, setLanguage] = useState('en-IN');

  // Fetch list of sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/sites');
        const data = await res.json();
        setSites(data);
      } catch (err) {
        console.error('❌ Failed to fetch sites:', err);
      }
    };
    fetchSites();
  }, []);

  // Fetch tasks based on filters
  const fetchTasks = async () => {
    if (!email) return;
    try {
      let query = `?email=${email}`;
      if (selectedDate) query += `&date=${selectedDate}`;
      if (siteId) query += `&siteId=${siteId}`;

      const res = await fetch(`http://localhost:5000/api/tasks${query}`);
      const data = await res.json();
      setAssignedTasks(data);
    } catch (err) {
      console.error('❌ Error fetching tasks:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [email, selectedDate, siteId]);

  // Assign a task
  const assignTask = async () => {
    if (!siteId) return alert('Please select a site.');
    if (!assignedBy.trim()) return alert('Enter your name.');
    if (!email.trim()) return alert('Enter a valid worker email.');
    if (!task.trim()) return alert('Task cannot be empty.');

    try {
      const res = await fetch('http://localhost:5000/api/tasks/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          assignedBy,
          assignedTo: email,
          task,
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert('❌ ' + data.error);

      setTask('');
      setEmail('');
      setSiteId('');
      setAssignedBy('');
      fetchTasks();
    } catch (err) {
      console.error('❌ Failed to assign task:', err);
    }
  };

  // Mark task as complete
  const completeTask = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: id }),
      });
      fetchTasks();
    } catch (err) {
      console.error('❌ Failed to complete task:', err);
    }
  };

  // Voice input handler
  const handleVoiceInput = () => {
    if (!recognition) return alert('Voice recognition not supported.');
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
    <div className="task-panel-container">
      <h4>📋 Assign Work (Site Engineer)</h4>

      {listening && (
        <div className="listening-toast">🎤 Listening... Speak your task.</div>
      )}

      <div className="task-panel-grid">
        {/* Left Column */}
        <div className="task-left">
          {/* Site Engineer Name */}
          <label>Site Engineer Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={assignedBy}
            onChange={(e) => setAssignedBy(e.target.value)}
          />

          {/* Site Dropdown */}
          <label className="mt-3">Select Site</label>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="form-select"
          >
            <option value="">-- Select Site --</option>
            {sites.map((site) => (
              <option key={site._id} value={site._id}>
                {site.name}
              </option>
            ))}
          </select>

          {/* Worker Email */}
          <label className="mt-3">Worker's Email</label>
          <input
            type="email"
            placeholder="Enter worker email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Task Description + Voice */}
          <label className="mt-3">Task Description</label>
          <div className="task-input-voice">
            <input
              type="text"
              placeholder="Describe the task"
              value={task}
              onChange={(e) => setTask(e.target.value)}
            />
            <button type="button" className="btn-voice" onClick={handleVoiceInput}>
              🎤
            </button>
          </div>

          {/* Language */}
          <div className="language-select mt-3">
            <label>Select Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="form-select"
            >
              <option value="en-IN">English</option>
              <option value="hi-IN">Hindi</option>
              <option value="mr-IN">Marathi</option>
            </select>
          </div>

          <button className="btn btn-primary mt-3" onClick={assignTask}>
            Assign Task
          </button>

          {/* Filter by Date */}
          <div className="mt-4">
            <label>Filter by Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="task-right">
          <h5>🛠 Assigned Tasks</h5>
          <ul className="assigned-tasks">
            {assignedTasks.length > 0 ? (
              assignedTasks.map((t) => (
                <li key={t._id}>
                  <div><strong>Task:</strong> {t.task}</div>
                  <div><strong>Assigned By:</strong> {t.assignedBy}</div>
                  <div>
                    <strong>Site:</strong>{' '}
                    {sites.find((s) => s._id === t.siteId)?.name || t.siteId}
                  </div>
                  <div className="task-actions">
                    <span className={`badge ${t.status === 'done' ? 'badge-done' : 'badge-pending'}`}>
                      {t.status}
                    </span>
                    {t.status !== 'done' && (
                      <button className="complete-btn" onClick={() => completeTask(t._id)}>✔</button>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="text-muted">No tasks found for this email.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TaskPanel;
