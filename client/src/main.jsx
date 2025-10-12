import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.jsx";
import HomePage from "./pages/HomePage.jsx";
import EnhancePage from "./pages/EnhancePage.jsx";
import "./index.css"; // We'll add some basic styles here later

// This is where we define the navigation routes for the application.
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // The main App component acts as the layout/shell
    children: [
      {
        index: true, // This makes HomePage the default route for '/'
        element: <HomePage />,
      },
      {
        path: "enhance", // The path for the resume enhancement page
        element: <EnhancePage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
