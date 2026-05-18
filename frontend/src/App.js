import React, { useState, useRef } from "react";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handlePredict = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", image);
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Prediction failed");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError("Could not connect to the server. Make sure the API is running.");
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 0.85) return "#22c55e";
    if (conf >= 0.60) return "#f59e0b";
    return "#ef4444";
  };

  const getDiseaseColor = (cls) => {
    if (cls === "Healthy") return "#22c55e";
    if (cls === "Early Blight") return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-icon">🥔</div>
        <h1>Potato Disease Detector</h1>
        <p>Upload a potato leaf image to detect disease using AI</p>
      </header>

      <main className="main">
        <div
          className={`drop-zone ${dragging ? "dragging" : ""} ${preview ? "has-image" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          {preview ? (
            <img src={preview} alt="Uploaded leaf" className="preview-img" />
          ) : (
            <div className="drop-placeholder">
              <span className="drop-icon">📷</span>
              <p>Drag & drop a leaf image here</p>
              <span className="drop-sub">or click to browse</span>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        <div className="actions">
          <button
            className="btn-predict"
            onClick={handlePredict}
            disabled={!image || loading}
          >
            {loading ? "Analyzing..." : "Analyze Leaf"}
          </button>
          {preview && (
            <button
              className="btn-clear"
              onClick={() => { setImage(null); setPreview(null); setResult(null); setError(null); }}
            >
              Clear
            </button>
          )}
        </div>

        {error && <div className="error-box">{error}</div>}

        {result && (
          <div className="result-card">
            <h2>Diagnosis Result</h2>
            <div className="result-disease" style={{ color: getDiseaseColor(result.class) }}>
              {result.class === "Healthy" ? "✅" : "⚠️"} {result.class}
            </div>
            <div className="confidence-row">
              <span>Confidence</span>
              <span style={{ color: getConfidenceColor(result.confidence) }}>
                {(result.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{
                  width: `${result.confidence * 100}%`,
                  background: getConfidenceColor(result.confidence),
                }}
              />
            </div>
            {result.class !== "Healthy" && (
              <p className="advice">
                {result.class === "Early Blight"
                  ? "Apply copper-based fungicide. Remove affected leaves early."
                  : "Use resistant varieties. Apply mancozeb or metalaxyl fungicide."}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;