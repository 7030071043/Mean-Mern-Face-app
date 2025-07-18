import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceRecognitionPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [descriptor, setDescriptor] = useState(null);
  const [status, setStatus] = useState('');
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [matchedFace, setMatchedFace] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const successSound = new Audio(process.env.PUBLIC_URL + '/success.mp3');

  const speak = (text) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    synth.speak(utter);
  };

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL + '/tiny_face_detector'),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL + '/face_landmark_68'),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL + '/face_recognition')
      ]);
    };
    loadModels();
  }, []);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => console.error("Camera error:", err));
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/attendance/today');
      const data = await res.json();
      setTodayAttendance(data);

      const uniqueEmails = [...new Set(data.map(r => r.email))];
      const summary = `📊 ${uniqueEmails.length} unique workers marked attendance today.`;
      setAiSummary(summary);
      speak(summary);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
  const interval = setInterval(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== 4) return;

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const dims = faceapi.matchDimensions(canvas, {
      width: video.videoWidth,
      height: video.videoHeight
    });

    canvas.width = dims.width;
    canvas.height = dims.height;

    const resized = faceapi.resizeResults(detections, dims);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceLandmarks(canvas, resized);

    if (detections.length > 0) {
      const descriptor = detections[0].descriptor;
      setDescriptor(descriptor);

      try {
        const res = await fetch('http://localhost:5000/api/descriptors');
        const knownFaces = await res.json();

        let matched = false;
        for (let face of knownFaces) {
          const storedDescriptor = new Float32Array(face.descriptor);
          const distance = faceapi.euclideanDistance(descriptor, storedDescriptor);
          if (distance < 0.5) {
            if (matchedFace?.email !== face.email) {
              const msg = `✅ Face matched: ${face.email}`;
              setStatus(msg);
              setMatchedFace(face);
              speak(`Face matched with ${face.email}`);
              successSound.play().catch(err => console.warn("🔇 Audio play error:", err));
            }
            matched = true;
            break;
          }
        }

        if (!matched) {
          if (matchedFace !== null) {
            setMatchedFace(null);
            setStatus("❌ No match found");
            speak("No match found. Please try again.");
          }
        }

      } catch (err) {
        console.error("Error fetching descriptors:", err);
      }
    } else {
      setStatus("😐 No face detected");
    }
  }, 2000);

  return () => clearInterval(interval);
}, [matchedFace]);

  const markAttendance = async () => {
    if (!matchedFace) return alert("No matched face available!");

    const alreadyMarked = todayAttendance.find(a => a.email === matchedFace.email);
    if (alreadyMarked) {
      alert("Attendance already marked for this user today!");
      speak("Attendance already marked.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: matchedFace.email })
      });
      const result = await res.json();
      alert(result.message);
      speak(result.message);
      fetchTodayAttendance();
      setMatchedFace(null);
      setStatus('');
    } catch (err) {
      console.error("Error marking attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveDescriptor = async () => {
    if (!descriptor) return alert("No face detected!");
    const email = prompt("Enter user email to save face:");
    if (!email) return;
    try {
      const res = await fetch('http://localhost:5000/api/save-descriptor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, descriptor: Array.from(descriptor) })
      });
      if (res.ok) {
        alert("✅ Face saved!");
        speak("Face saved successfully");
      } else {
        alert("❌ Failed to save face!");
      }
    } catch (err) {
      console.error("Error saving descriptor:", err);
    }
  };

  return (
    <div className="container py-4">
      <h3 className="text-center text-primary mb-4">📷 Face Recognition (Live)</h3>

      <div className="d-flex justify-content-center mb-4">
        <div className="position-relative w-100" style={{ maxWidth: '720px' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            width="100%"
            className="img-fluid border rounded"
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1
            }}
          />
        </div>
      </div>

      <p className="text-center fw-bold">{status}</p>

      {matchedFace && (
        <div className="alert alert-success text-center">
          🎉 Matched with: <strong>{matchedFace.email}</strong>
        </div>
      )}

      <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
        <button
          className="btn btn-primary"
          onClick={markAttendance}
          disabled={!matchedFace || loading}
        >
          📝 Mark Attendance
        </button>
        <button
          className="btn btn-success"
          onClick={saveDescriptor}
          disabled={loading}
        >
          💾 Save Face
        </button>
      </div>

      {aiSummary && (
        <div className="alert alert-info text-center">
          🤖 AI Summary: {aiSummary}
        </div>
      )}

      <h5 className="mt-4">📋 Today’s Attendance</h5>
      <ul className="list-group">
        {todayAttendance.length > 0 ? (
          todayAttendance.map((entry, index) => (
            <li key={`${entry.email}-${entry.timestamp}`} className="list-group-item d-flex justify-content-between flex-wrap">
              <span>{index + 1}. {entry.email}</span>
              <small className="text-muted">{new Date(entry.timestamp).toLocaleTimeString()}</small>
            </li>
          ))
        ) : (
          <li className="list-group-item text-muted">No entries yet</li>
        )}
      </ul>
    </div>
  );
};

export default FaceRecognitionPage;
