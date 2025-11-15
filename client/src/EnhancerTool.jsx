import React, { useState } from 'react';
import axios from 'axios';

import ResultsDashboard from './ResultsDashboard.jsx';

export default function EnhanceTool() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobLink, setJobLink] = useState('');

  const [appState, setAppState] = useState('form'); 
  const [errorMessage, setErrorMessage] = useState('');

  const [aiSkills, setAiSkills] = useState([]); 
  const [userSkills, setUserSkills] = useState([]); 
  const [downloadUrl, setDownloadUrl] = useState(''); 


  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleLinkChange = (e) => {
    setJobLink(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobLink) {
      setErrorMessage('Please provide both a resume and a job link.');
      return;
    }

    setAppState('loading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobUrl', jobLink);

    try {
      // Make the API call
      const response = await axios.post(
        'http://localhost:3001/api/enhance',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );


      setAiSkills(response.data.aiRecommendedSkills);
      setUserSkills(response.data.userExistingSkills);
      const url =
        'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,' +
        response.data.fileData;
      setDownloadUrl(url);


      setAppState('success');
    } catch (error) {
      // Handle error
      console.error('Error enhancing resume:', error);
      setErrorMessage(
        error.response?.data?.error ||
          'An unknown error occurred. Please try again.'
      );
      setAppState('error');
    }
  };

  // Reset the form to start over
  const handleReset = () => {
    setResumeFile(null);
    setJobLink('');
    setAppState('form');
    setErrorMessage('');
    setAiSkills([]);
    setUserSkills([]);
    setDownloadUrl('');

  };
  const renderContent = () => {
    switch (appState) {
      case 'loading':
        return (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Analyzing your resume... this may take a moment.</p>
          </div>
        );

      case 'success':
        return (
          <ResultsDashboard
            aiSkills={aiSkills}
            userSkills={userSkills}
            downloadUrl={downloadUrl}
            onReset={handleReset}
          />
        );

      case 'error':
        return (
          <div className="result-container">
            <h2>Something Went Wrong</h2>
            <p className="error-message">{errorMessage}</p>
            <button onClick={handleReset} className="btn-secondary">
              Try Again
            </button>
          </div>
        );

      case 'form':
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
                {resumeFile ? resumeFile.name : 'Click to select .docx file'}
              </label>
              <input
                id="resumeFile"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                style={{ display: 'none' }}
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

  return <div>{renderContent()}</div>;
}