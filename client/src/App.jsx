import React from "react";
import { Link, Outlet } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold text-blue-600 hover:text-blue-800"
          >
            Resume Enhancer
          </Link>
          <ul className="flex items-center space-x-6">
            <li>
              <Link to="/" className="text-gray-600 hover:text-blue-600">
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/enhance"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
              >
                Enhance My Resume
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main className="container mx-auto p-6 md:p-8">
        <Outlet />
      </main>

      <footer className="text-center py-4 mt-8 border-t">
        <p className="text-gray-500">
          &copy; 2025 Resume Enhancer. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;
