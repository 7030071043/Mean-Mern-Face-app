import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import "./FaceRecognitionPage.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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
      // console.log("✅ Models loaded");
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

          try {
            // ✅ Directly use Cloudinary photo URL
            const photoUrl = worker.photo;
            // console.log("🖼 Loading face for:", worker.name, photoUrl);

            const img = await faceapi.fetchImage(photoUrl);

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
              // console.log(`✅ Descriptor created for ${worker.name}`);
            } else {
              console.warn(`⚠ No face detected in photo for ${worker.name}`);
            }
          } catch (err) {
            console.error(`❌ Error processing ${worker.name}:`, err);
          }
        }

        // console.log(`✅ Loaded workers with descriptors: ${tempDescriptors.length}`);
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

      // Detect faces
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      // console.log("📸 Detections:", detections.length);

      const dims = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, dims);
      canvas.width = dims.width;
      canvas.height = dims.height;

      const resized = faceapi.resizeResults(detections, dims);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ✅ Draw boxes & landmarks
      faceapi.draw.drawDetections(canvas, resized);
      // faceapi.draw.drawFaceLandmarks(canvas, resized); for the face model data points

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
            successSound.play().catch(() => { });
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
      <div className="card shadow-lg border-0 rounded-4 p-4">
        <h3 className="text-center text-primary mb-3 fw-bold">
          📸 Face Recognition Attendance
        </h3>

        {!modelsLoaded && (
          <div className="alert alert-warning text-center">
            ⏳ Loading face recognition models...
          </div>
        )}

        {!cameraReady && (
          <div className="alert alert-warning text-center">
            🎥 Initializing your camera...
          </div>
        )}

        {/* Site Selection */}
        <div className="d-flex justify-content-center mb-4">
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="form-select w-auto border-primary shadow-sm rounded-pill"
          >
            <option value="">📍 Select a Site</option>
            {sites.map((site) => (
              <option key={site._id} value={site._id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        {/* Camera Display */}
        <div className="camera-wrapper d-flex justify-content-center mb-4">
          <div
            className="position-relative camera-box border border-3 border-primary rounded-4 shadow-sm overflow-hidden"
            style={{ maxWidth: "720px" }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              className="img-fluid rounded-4"
              width="100%"
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 1,
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        </div>

        {/* Status Section */}
        <div className="text-center mb-3">
          <span
            className={`badge ${status.includes("✅")
                ? "bg-success"
                : status.includes("⚠")
                  ? "bg-warning text-dark"
                  : status.includes("❌")
                    ? "bg-danger"
                    : "bg-secondary"
              } p-2 px-3 fs-6`}
          >
            {status || "Idle..."}
          </span>
        </div>

        {matchedWorker && (
          <div className="alert alert-success text-center shadow-sm">
            🎉 Matched with: <strong>{matchedWorker.name}</strong>
          </div>
        )}

        <div className="d-flex justify-content-center mb-4">
          <button
            className="btn btn-outline-primary btn-lg rounded-pill shadow-sm"
            onClick={() => markAttendance()}
            disabled={!matchedWorker}
          >
            📝 Mark Attendance
          </button>
        </div>

        {/* Attendance List */}
        <div className="attendance-section container mt-4">
  <h5 className="text-center mb-3 text-secondary fw-semibold">
    📋 Today’s Attendance
  </h5>

  {todayAttendance.length > 0 ? (
    <ul className="list-group shadow-sm rounded-3 overflow-hidden">
      {todayAttendance.map((entry, index) => (
        <li
          key={`${entry.email}-${entry.timestamp}-${index}`}
          className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-sm-center py-3 px-3"
        >
          {/* Left side (index + email) */}
          <div className="d-flex align-items-center gap-2 flex-wrap text-break w-100 w-sm-auto">
            <span className="fw-semibold text-dark small">
              {index + 1}.
            </span>
            <span className="text-primary fw-semibold email-text">
              {entry.email}
            </span>
          </div>

          {/* Right side (time) */}
          <div className="mt-2 mt-sm-0 text-sm-end">
            <span className="badge punch-time-badge">
              🕒 {new Date(entry.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <div className="text-center text-muted py-3 border rounded-3 bg-light small">
      No attendance recorded yet
    </div>
  )}
</div>


      </div>
    </div>
  );


};

export default FaceRecognitionPage;
