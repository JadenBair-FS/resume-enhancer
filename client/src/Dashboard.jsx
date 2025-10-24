import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabaseClient";
import EnhanceTool from "./EnhancerTool.jsx";
import History from "./History.jsx";
import Storage from "./Storage.jsx";
import "./App.css";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeView, setActiveView] = useState("enhance");

  useEffect(() => {
    let isMounted = true;
    console.log(
      "Dashboard: user object changed, attempting to fetch profile..."
    );

    const fetchProfile = async () => {
      if (user) {
        setProfileLoading(true);
        try {
          const { data, error } = await supabase.rpc("get_my_profile").single();

          if (error) throw error;

          if (isMounted) {
            console.log("Dashboard: Profile fetched:", data);
            setProfile(data);
          }
        } catch (e) {
          console.error("Dashboard: Error fetching profile:", e.message);
        } finally {
          if (isMounted) setProfileLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Check if the user is a paid user.
  const isPaidUser = profile && profile.subscription_tier === "paid";

  const renderView = () => {
    if (profileLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      );
    }

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
          {!profileLoading && isPaidUser && (
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

          {!profileLoading && !isPaidUser && (
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
