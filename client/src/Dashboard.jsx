import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import EnhanceTool from "./EnhancerTool.jsx";
import History from "./History.jsx";
import Storage from "./Storage.jsx";
import "./App.css";

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const [activeView, setActiveView] = useState("enhance");

  const isPaidUser = profile && profile.subscription_tier === "paid";

  const renderView = () => {
    switch (activeView) {
      case "history":
        return isPaidUser ? <History /> : <EnhanceTool />;
      case "storage":
        return isPaidUser ? <Storage /> : <EnhanceTool />;
      case "enhance":
      default:
        return <EnhanceTool />;
    }
  };

  return (
    <div className="card dashboard-card">
      <header className="header-with-logout">
        <div className="header-content">
          <h1>Dashboard 🚀</h1>
          <p>Welcome, {user.email}</p>
        </div>
        <button onClick={signOut} className="btn-logout">
          Logout
        </button>
      </header>
      <div className="dashboard-layout">
        <nav className="dashboard-nav">
          <button
            className={`nav-btn ${activeView === "enhance" ? "active" : ""}`}
            onClick={() => setActiveView("enhance")}
          >
            Enhance Resume
          </button>

          {isPaidUser && (
            <>
              <button
                className={`nav-btn ${
                  activeView === "history" ? "active" : ""
                }`}
                onClick={() => setActiveView("history")}
              >
                History
              </button>
              <button
                className={`nav-btn ${
                  activeView === "storage" ? "active" : ""
                }`}
                onClick={() => setActiveView("storage")}
              >
                Cloud Storage
              </button>
            </>
          )}

          {!isPaidUser && (
            <div className="nav-upgrade">
              <p>Want cloud storage and history?</p>
              <button className="btn-primary upgrade-btn">Upgrade Now</button>
            </div>
          )}
        </nav>

        <main className="dashboard-content">{renderView()}</main>
      </div>
    </div>
  );
}
