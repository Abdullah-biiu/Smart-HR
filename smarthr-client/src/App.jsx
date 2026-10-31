import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./Login";
import Dashboard from "./components/Dashboard";
import Employees from "./components/Employees";
import Attendance from "./components/Attendance";
import Leave from "./components/Leave";
import Payroll from "./components/Payroll";

function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            token ? (
              <Dashboard />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/employees"
          element={
            token ? (
              <Employees />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/attendance"
          element={
            token ? (
              <Attendance />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/leave"
          element={
            token ? (
              <Leave />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/payroll"
          element={
            token ? (
              <Payroll />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;