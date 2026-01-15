import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import MarketBackground from "./pages/MarketBackground";
import Landing from "./pages/Landing";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import "./styles/landing.css";

const App = () => {
  const [view, setView] = useState("landing");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("trackpad_user");
    if (storedUser) {
      setUser(storedUser);
      setView("dashboard");
    }
  }, []);

  const handleAuthSuccess = (email) => {
    setUser(email);
    setView("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("trackpad_user");
    setUser(null);
    setView("landing");
  };

  if (view === "dashboard" && user) {
    return (
      <ThemeProvider>
        <Dashboard onLogout={handleLogout} />
      </ThemeProvider>
    );
  }

  return (
    <div className="app-root min-vh-100 position-relative">
      <MarketBackground />
      <nav className="navbar navbar-dark py-4">
        <div className="container">
          <a
            className="navbar-brand nav-logo"
            href="#"
            onClick={() => setView("landing")}
          >
            NEXUS<span style={{ color: "var(--primary-blue)" }}>.</span>
          </a>
          <div className="d-flex gap-4 align-items-center">
            <button
              onClick={() => setView("signin")}
              className="btn btn-link text-white text-decoration-none small fw-bold uppercase"
            >
              CONNECT
            </button>
            <button
              onClick={() => setView("signup")}
              className="btn btn-light rounded-pill px-4 py-2 small fw-black uppercase"
            >
              GET STARTED
            </button>
          </div>
        </div>
      </nav>
      <main className="py-5">
        <AnimatePresence mode="wait">
          {view === "landing" && (
            <Landing key="landing" onStart={() => setView("signin")} />
          )}
          {view === "signin" && (
            <SignIn
              key="signin"
              onSwitch={() => setView("signup")}
              onBack={() => setView("landing")}
              onSuccess={handleAuthSuccess}
            />
          )}
          {view === "signup" && (
            <SignUp
              key="signup"
              onSwitch={() => setView("signin")}
              onBack={() => setView("landing")}
              onSuccess={handleAuthSuccess}
            />
          )}
        </AnimatePresence>
      </main>
      <div
        style={{
          position: "fixed",
          bottom: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.2,
          fontSize: "0.6rem",
          fontWeight: 900,
          letterSpacing: "5px",
          textTransform: "uppercase",
          zIndex: -1,
        }}
      >
        Nexus Execution Layer // Node Activated
      </div>
    </div>
  );
};

export default App;
