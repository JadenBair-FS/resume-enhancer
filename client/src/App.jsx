import React from "react";
import { useAuth } from "./useAuth.jsx";
import AuthForm from "./AuthForm.jsx";
import Dashboard from "./Dashboard.jsx";
import "./App.css";

function App() {
  const { session } = useAuth();

  return (
    <div className="app-container">
      {session ? <Dashboard /> : <AuthForm />}
    </div>
  );
}

export default App;
