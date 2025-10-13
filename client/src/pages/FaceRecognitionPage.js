// client/src/pages/FaceRecognitionPage.js
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import './FaceRecognitionPage.css';

// Dynamic API URL for localhost or Render
const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://mean-mern-face-app-pbyy.onrender.com/api');

const FaceRecognitionPage = ({ onAttendanceMarked }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [workers, setWorkers] = useState([]);
  const [descriptors, setDescriptors] = useState([]);
  const [matchedWorker, setMatchedWorker] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [status, setStatus] = useState("");

  const successSound = new Audio(process.env.PUBLIC_URL + "/success.mp3");

  // --- Load face-api models ---
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(`${MODEL_URL}/tiny_face_detector`),
        faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_URL}/face_landmark_68`),
        faceapi.nets.faceRecognitionNet.loadFromUri(`${MODEL_URL}/face_recognition`),
      ]);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  // --- Start camera ---
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraReady(true);
      })
      .catch((err) => console.error("Camera error:", err));
  }, []);

  // --- Load workers and descriptors ---
  useEffect(() => {
    if (!modelsLoaded) return;
    const loadWorkers = async () => {
      try {
        const res = await fetch(`${API_URL}/workers`);
        const data = await res.json();
        setWorkers(data);

        const tempDescriptors = [];
        for (let worker of data) {
          if (!worker.photo) continue;
          const img = await faceapi.fetchImage(`${API_URL.replace('/api', '')}/uploads/${worker.photo}`);
          const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            tempDescriptors.push({
              email: worker.email,
              name: worker.name,
              descriptor: detection.descriptor,
            });
          }
        }
        setDescriptors(tempDescriptors);
      } catch (err) {
        console.error("❌ Error loading workers:", err);
      }
    };
    loadWorkers();
  }, [modelsLoaded]);

  // --- Fetch today's attendance & sites ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const attRes = await fetch(`${API_URL}/attendance/today`);
        setTodayAttendance(await attRes.json());

        const siteRes = await fetch(`${API_URL}/sites`);
        const siteData = await siteRes.json();
        setSites(siteData);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // --- Face recognition loop ---
  useEffect(() => {
    if (!modelsLoaded || !cameraReady || descriptors.length === 0) return;

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
        height: video.videoHeight,
      });
      canvas.width = dims.width;
      canvas.height = dims.height;

      const resized = faceapi.resizeResults(detections, dims);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resized);

      if (detections.length > 0 && selectedSite) {
        const liveDescriptor = detections[0].descriptor;

        let bestMatch = null;
        let minDistance = 1;
        for (let worker of descriptors) {
          const distance = faceapi.euclideanDistance(liveDescriptor, worker.descriptor);
          if (distance < minDistance) {
            minDistance = distance;
            bestMatch = worker;
          }
        }

        if (bestMatch && minDistance < 0.5) {
          if (!matchedWorker || matchedWorker.email !== bestMatch.email) {
            setMatchedWorker(bestMatch);
            setStatus(`✅ Matched: ${bestMatch.name}`);
            successSound.play().catch(() => {});
            await markAttendance(bestMatch.email);
          }
        } else {
          setMatchedWorker(null);
          setStatus("❌ No match found");
        }
      } else if (!selectedSite) {
        setStatus("⚠ Please select a site!");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [descriptors, matchedWorker, cameraReady, selectedSite]);

  // --- Mark attendance ---
  const markAttendance = async (emailParam) => {
    const email = emailParam || matchedWorker?.email;
    if (!email || !selectedSite) return;

    try {
      const res = await fetch(`${API_URL}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, siteId: selectedSite }),
      });
      const result = await res.json();
      if (!res.ok) return alert(result.error || "Server error");

      const siteName = sites.find((s) => s._id === selectedSite)?.name || "";
      const newRecord = { email, siteId: selectedSite, siteName, timestamp: new Date() };
      setTodayAttendance((prev) => [...prev, newRecord]);
      if (onAttendanceMarked) onAttendanceMarked([newRecord]);
    } catch (err) {
      console.error("❌ Error marking attendance:", err);
    }
  };

  return (
    <div className="container py-4 face-page">
      <h3 className="text-center text-primary mb-4">📷 Face Recognition</h3>

      {!modelsLoaded && <p className="text-center text-warning">Loading models...</p>}
      {!cameraReady && <p className="text-center text-warning">Initializing camera...</p>}

      {/* Site Selection */}
      <div className="d-flex justify-content-center mb-3">
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          className="form-select w-auto site-select"
        >
          <option value="">📌 Please select a site</option>
          {sites.map((site) => (
            <option key={site._id} value={site._id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      {/* Video & Canvas */}
      <div className="d-flex justify-content-center mb-4 camera-wrapper">
        <div className="position-relative w-100" style={{ maxWidth: "720px" }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            width="100%"
            className="img-fluid border rounded shadow-sm"
          />
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 1,
            }}
          />
        </div>
      </div>

      <p className="text-center fw-bold status-text">{status}</p>

      {matchedWorker && (
        <div className="alert alert-success text-center shadow-sm">
          🎉 Matched with: <strong>{matchedWorker.name}</strong>
        </div>
      )}

      <div className="d-flex justify-content-center mb-4 flex-wrap gap-2">
        <button
          className="btn btn-primary btn-lg"
          onClick={() => markAttendance()}
          disabled={!matchedWorker}
        >
          📝 Mark Attendance Manually
        </button>
      </div>

      <h5 className="mt-4 mb-2">📋 Today’s Attendance</h5>
      <ul className="list-group attendance-list">
        {todayAttendance.length > 0 ? (
          todayAttendance.map((entry, index) => (
            <li
              key={`${entry.email}-${entry.timestamp}`}
              className="list-group-item d-flex justify-content-between flex-wrap align-items-center"
            >
              <span>
                {index + 1}. {entry.email}
              </span>
              <small className="text-muted">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </small>
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
