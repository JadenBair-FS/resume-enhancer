import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  // Form state
  const [resumeFile, setResumeFile] = useState(null);
  const [jobLink, setJobLink] = useState("");

  // App state
  const [appState, setAppState] = useState("form");
  const [errorMessage, setErrorMessage] = useState("");

  // Result state
  const [addedSkills, setAddedSkills] = useState([]);
  const [downloadPath, setDownloadPath] = useState("");

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleLinkChange = (e) => {
    setJobLink(e.target.value);
  };

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
      // Make the API call
      const response = await axios.post(
        "http://localhost:3001/api/enhance",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Handle success
      setAddedSkills(response.data.detectedSkills);
      setDownloadPath(
        response.data.resumePath.replace(
          "uploads/",
          "http://localhost:3001/responses/enhanced-"
        )
      );
      setAppState("success");
    } catch (error) {
      // Handle error
      console.error("Error enhancing resume:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "An unknown error occurred. Please try again."
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

  const renderContent = () => {
    switch (appState) {
      case "loading":
        return (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Enhancing your resume... this may take a moment.</p>
          </div>
        );

      case "success":
        return (
          <div className="result-container">
            <h2>Enhancement Complete!</h2>
            <p>We successfully added the following skills to your resume:</p>
            <ul className="skills-list">
              {addedSkills.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
            <a href={`${downloadPath}`} className="btn-primary" download>
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
  };

  return (
    <div className="app-container">
      <div className="card">
        <header>
          <h1>Resume Enhancer</h1>
          <p>
            Upload your resume and a job link. We'll add the key skills for you.
          </p>
        </header>
        <main>{renderContent()}</main>
      </div>
    </div>
  );
}

export default App;
