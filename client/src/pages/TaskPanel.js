import React, { useState, useEffect } from 'react';
import './TaskPanel.css'; // Import the CSS file

// Voice recognition setup
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const TaskPanel = () => {
  const [email, setEmail] = useState('');
  const [task, setTask] = useState('');
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [listening, setListening] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // Fetch tasks by email and optional date
  const fetchTasks = async () => {
    if (!email) return;
    try {
      const query = selectedDate ? `?date=${selectedDate}` : '';
      const res = await fetch(`http://localhost:5000/api/tasks/${email}${query}`);
      const data = await res.json();
      setAssignedTasks(data);
    } catch (err) {
      console.error('❌ Error fetching tasks:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [email, selectedDate]);

  const assignTask = async () => {
    if (!email.trim()) return alert('Enter a valid worker email.');
    if (!task.trim()) return alert('Task cannot be empty.');

    try {
      await fetch('http://localhost:5000/api/tasks/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          task,
          assignedBy: 'site-engineer@example.com',
        }),
      });
      setTask('');
      fetchTasks();
    } catch (err) {
      console.error('❌ Failed to assign task:', err);
    }
  };

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

  const handleVoiceInput = () => {
    if (!recognition) return alert('Voice recognition not supported.');
    recognition.lang = 'en-IN';
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
          <label>Worker's Email</label>
          <input
            type="email"
            placeholder="Enter worker email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

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

          <button className="btn btn-primary mt-3" onClick={assignTask}>
            Assign Task
          </button>

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
                  <span>{t.task}</span>
                  <div className="task-actions">
                    <span
                      className={`badge ${
                        t.status === 'done' ? 'badge-done' : 'badge-pending'
                      }`}
                    >
                      {t.status}
                    </span>
                    {t.status !== 'done' && (
                      <button
                        className="complete-btn"
                        onClick={() => completeTask(t._id)}
                      >
                        ✔
                      </button>
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
