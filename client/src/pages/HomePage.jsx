import React from "react";
import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="text-center bg-white p-8 rounded-lg shadow-lg">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
        Supercharge Your Resume for the ATS
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Upload your resume and provide a job description URL. We'll analyze the
        job for key skills and automatically insert them into your resume to
        help you pass the Applicant Tracking System.
      </p>
      <Link
        to="/enhance"
        className="inline-block bg-green-500 text-white font-bold text-lg px-8 py-3 rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105"
      >
        Get Started Now
      </Link>
    </div>
  );
}

export default HomePage;
