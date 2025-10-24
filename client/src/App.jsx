import { useAuth } from "./AuthContext";
import AuthForm from "./AuthForm.jsx";
import Dashboard from "./Dashboard.jsx";
import "./App.css";

function App() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div
        className="app-container"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div className="loading-spinner"></div>
      </div>
    );
  }
  return (
    <div className="app-container">
      {session ? <Dashboard /> : <AuthForm />}
    </div>
  );
}

export default App;
