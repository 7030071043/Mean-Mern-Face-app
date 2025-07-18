import React, { useState, useEffect } from 'react';

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
  if (!email || !email.includes('@')) return;
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
  if (!email.includes('@')) return alert('Enter a valid worker email.');
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

// Add state for editing
const [editingTaskId, setEditingTaskId] = useState(null);
const [editText, setEditText] = useState('');

const startEdit = (task) => {
  setEditingTaskId(task._id);
  setEditText(task.task);
};

const saveEdit = async (id) => {
  try {
    await fetch(`http://localhost:5000/api/tasks/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: id, updatedTask: editText }),
    });
    setEditingTaskId(null);
    setEditText('');
    fetchTasks();
  } catch (err) {
    console.error('❌ Failed to edit task:', err);
  }
};

const deleteTask = async (id) => {
  if (!window.confirm('Are you sure you want to delete this task?')) return;
  try {
    await fetch(`http://localhost:5000/api/tasks/${id}`, {
      method: 'DELETE',
    });
    fetchTasks();
  } catch (err) {
    console.error('❌ Failed to delete task:', err);
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
    if (!recognition) {
      alert('Voice recognition not supported in this browser.');
      return;
    }

    recognition.lang = 'en-IN';
    recognition.start();
    setListening(true);

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      setTask((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
      setListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  return (
    <div className="container p-4 border rounded shadow-sm max-w-3xl mx-auto">
      <h4 className="text-2xl font-semibold mb-4">📋 Assign Work (Site Engineer)</h4>

      {/* Toast for Listening */}
      {listening && (
        <div className="mb-3 p-3 bg-blue-100 text-blue-800 rounded">
          🎤 Listening... Please speak your task description.
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="email"
          className="form-control"
          placeholder="Worker's Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            className="form-control flex-1"
            placeholder="Task Description"
            value={task}
            onChange={(e) => setTask(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline-secondary mt-2"
            onClick={handleVoiceInput}
            title="Speak Task"
          >
            🎤
          </button>
        </div>
        <button className="btn btn-primary w-full mt-2" onClick={assignTask}>
          Assign Task
        </button>
      </div>

      {/* 📅 Date Filter */}
      <div className="mb-3 d-flex align-items-center gap-2">
        <label className="form-label mb-0">📅 Filter by Date:</label>
        <input
          type="date"
          className="form-control"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <h5 className="text-lg font-medium mb-2">🛠 Assigned Tasks</h5>
      <ul className="list-group max-h-72 overflow-auto">
        {assignedTasks.length > 0 ? (
          assignedTasks.map((t) => (
            <li
              key={t._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>{t.task}</span>
              <span className="d-flex align-items-center gap-2">
                <span
                  className={`badge ${
                    t.status === 'done' ? 'bg-success' : 'bg-warning'
                  }`}
                >
                  {t.status}
                </span>
                {t.status !== 'done' && (
                  <button
                    className="btn btn-sm btn-outline-success"
                    onClick={() => completeTask(t._id)}
                  >
                    ✔
                  </button>
                )}
                
              </span>
            </li>
          ))
        ) : (
          <li className="list-group-item text-muted">
            No tasks found for this email.
          </li>
        )}
      </ul>
    </div>
  );
};

export default TaskPanel;
