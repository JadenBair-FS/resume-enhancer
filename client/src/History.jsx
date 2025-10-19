import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("enhancement_history")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setHistory(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getDownloadUrl = (filePath) => {
    const filename = filePath.split("/").pop();
    return `http://localhost:3001/responses/enhanced-${filename}`;
  };

  if (loading) {
    return <div className="loading-spinner" style={{ margin: "0 auto" }}></div>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (history.length === 0) {
    return (
      <div>
        <h2>My Enhancement History</h2>
        <p>
          You haven't enhanced any resumes yet. Try the "Enhance Resume" tool!
        </p>
      </div>
    );
  }

  return (
    <div className="history-container">
      <h2>My Enhancement History</h2>
      <ul className="history-list">
        {history.map((item) => (
          <li key={item.id} className="history-item">
            <div className="history-item-header">
              <strong>{new Date(item.created_at).toLocaleDateString()}</strong>
              <a
                href={getDownloadUrl(item.file_path)}
                className="btn-primary btn-small"
                download
              >
                Download
              </a>
            </div>
            <p className="history-job-link">
              <strong>Job:</strong>{" "}
              <a href={item.job_link} target="_blank" rel="noopener noreferrer">
                {item.job_link.substring(0, 50)}...
              </a>
            </p>
            <p>
              <strong>Skills Added:</strong>
            </p>
            <ul className="skills-list">
              {item.detected_skills.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
