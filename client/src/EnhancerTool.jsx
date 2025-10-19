import React, { useState } from "react";
import axios from "axios";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";
import "./App.css";

export default function EnhanceTool() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobLink, setJobLink] = useState("");
  const [appState, setAppState] = useState("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [addedSkills, setAddedSkills] = useState([]);
  const [downloadPath, setDownloadPath] = useState("");

  const { user } = useAuth();

  const handleFileChange = (e) => setResumeFile(e.target.files[0]);
  const handleLinkChange = (e) => setJobLink(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobLink) {
      setErrorMessage("Please provide both a resume and a job link.");
      return;
    }

    setAppState("loading");
    setErrorMessage("");
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobUrl", jobLink);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/enhance",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const fullPath = response.data.resumePath;
      const filename = fullPath.split("/").pop();
      setDownloadPath(`http://localhost:3001/responses/enhanced-${filename}`);
      setAddedSkills(response.data.detectedSkills);
      setAppState("success");

      try {
        const { error } = await supabase.from("enhancement_history").insert({
          user_id: user.id,
          job_link: jobLink,
          detected_skills: response.data.detectedSkills,
          file_path: response.data.resumePath,
        });

        if (error) {
          console.error("Error saving history:", error.message);
        }
      } catch (e) {
        console.error("Exception saving history:", e.message);
      }
    } catch (error) {
      console.error("Error enhancing resume:", error);
      setErrorMessage(
        error.response?.data?.message || "An unknown error occurred."
      );
      setAppState("error");
    }
  };

  const handleReset = () => {
    setResumeFile(null);
    setJobLink("");
    setAppState("form");
    setErrorMessage("");
    setAddedSkills([]);
    setDownloadPath("");
  };

  switch (appState) {
    case "loading":
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Enhancing your resume...</p>
        </div>
      );
    case "success":
      return (
        <div className="result-container">
          <h2>Enhancement Complete!</h2>
          <p>We successfully added the following skills:</p>
          <ul className="skills-list">
            {addedSkills.map((skill, index) => (
              <li key={index}>{skill}</li>
            ))}
          </ul>
          <a href={downloadPath} className="btn-primary" download>
            Download Updated Resume
          </a>
          <button onClick={handleReset} className="btn-secondary">
            Enhance Another
          </button>
        </div>
      );
    case "error":
      return (
        <div className="result-container">
          <h2>Something Went Wrong</h2>
          <p className="error-message">{errorMessage}</p>
          <button onClick={handleReset} className="btn-secondary">
            Try Again
          </button>
        </div>
      );
    case "form":
    default:
      return (
        <form onSubmit={handleSubmit}>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <div className="form-group">
            <label htmlFor="jobLink">Job Description Link</label>
            <input
              id="jobLink"
              type="url"
              placeholder="https://www.linkedin.com/jobs/view/..."
              value={jobLink}
              onChange={handleLinkChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="resumeFile">Upload Your Resume</label>
            <label htmlFor="resumeFile" className="file-upload-label">
              {resumeFile ? resumeFile.name : "Click to select .docx file"}
            </label>
            <input
              id="resumeFile"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              style={{ display: "none" }}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={!resumeFile || !jobLink}
          >
            Enhance My Resume
          </button>
        </form>
      );
  }
}
