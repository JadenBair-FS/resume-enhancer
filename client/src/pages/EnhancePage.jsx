import React, { useState } from "react";

function EnhancePage() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobUrl, setJobUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    setResumeFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!resumeFile || !jobUrl) {
      setError("Please provide both a resume file and a job URL.");
      return;
    }

    setError("");
    setIsLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobUrl", jobUrl);

    try {
      // The backend server is expected to be running on localhost:3001
      const response = await fetch("http://localhost:3001/api/enhance", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(
        "Failed to enhance resume. Please check the console for details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
        Enhance Your Resume
      </h2>
      <p className="text-center text-gray-500 mb-6">
        Let's get your resume tailored for the job.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label
            htmlFor="resume-upload"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            1. Upload Your Resume (PDF)
          </label>
          <input
            type="file"
            id="resume-upload"
            onChange={handleFileChange}
            accept=".pdf"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
        </div>

        <div className="mb-8">
          <label
            htmlFor="job-url"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            2. Paste Job Description URL
          </label>
          <input
            type="url"
            id="job-url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://www.linkedin.com/jobs/view/..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all duration-300"
        >
          {isLoading ? "Analyzing..." : "Enhance Resume"}
        </button>
      </form>

      {error && <p className="mt-4 text-center text-red-500">{error}</p>}

      {result && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Analysis Complete!
          </h3>
          <p className="text-green-600 mb-2">{result.message}</p>
          <p className="font-medium">Detected Skills:</p>
          <ul className="list-disc list-inside bg-white p-3 rounded">
            {result.detectedSkills?.length > 0 ? (
              result.detectedSkills.map((skill) => <li key={skill}>{skill}</li>)
            ) : (
              <li>No specific skills from our list were detected.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default EnhancePage;
