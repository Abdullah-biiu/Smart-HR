import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payrolls, setPayrolls] = useState([]);

  const [recentActivities, setRecentActivities] = useState([]);

  const [loadingStats, setLoadingStats] = useState(true);

  // ================================
  // Logout
  // ================================

// ================================
// Logout
// ================================

const handleLogout = async () => {
  try {
    // Notify the backend to end the session
    const token = localStorage.getItem("token");

    if (token) {
      await api.post("/Auth/logout");
    }
  } catch (error) {
    console.error(
      "Logout request failed. Clearing local session anyway:",
      error
    );
  } finally {
    // Clear all login and session information
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionExpiresAt");
    localStorage.removeItem("sessionId");

    // Redirect to the login page
    window.location.replace("/");
  }
};
  // ================================
  // Load Dashboard Data
  // ================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);

        const [
          employeesResponse,
          attendanceResponse,
          leavesResponse,
          payrollResponse,
        ] = await Promise.all([
          api.get("/Employees"),
          api.get("/Attendance"),
          api.get("/Leaves"),
          api.get("/Payrolls"),
        ]);

        const employeesData = employeesResponse.data;
        const attendanceData = attendanceResponse.data;
        const leavesData = leavesResponse.data;
        const payrollData = payrollResponse.data;

        setEmployees(employeesData);
        setAttendance(attendanceData);
        setLeaves(leavesData);
        setPayrolls(payrollData);

        // ================================
        // Console Debugging
        // ================================

        console.log(
          "Dashboard employees:",
          employeesData
        );

        console.log(
          "Dashboard attendance:",
          attendanceData
        );

        console.log(
          "Dashboard leaves:",
          leavesData
        );

        console.log(
          "Dashboard payroll:",
          payrollData
        );

        // ================================
        // Create Recent Activities
        // ================================

        const activities = [];

        // Attendance activities
        attendanceData.forEach((record) => {
          activities.push({
            type: "Attendance",
            title: `Attendance marked as ${
              record.status || "Unknown"
            }`,
            date: record.attendanceDate,
            icon: "✓",
          });
        });

        // Leave activities
        leavesData.forEach((leave) => {
          activities.push({
            type: "Leave",
            title: `${
              leave.leaveType || "Leave"
            } leave - ${
              leave.status || "Unknown"
            }`,
            date: leave.startDate,
            icon: "◷",
          });
        });

        // Payroll activities
        payrollData.forEach((payroll) => {
          activities.push({
            type: "Payroll",
            title: `Payroll for ${
              payroll.year
            }/${payroll.month}`,
            date:
              payroll.paymentDate ||
              payroll.createdAt,
            icon: "₹",
          });
        });

        // Sort newest activity first
        activities.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);

          return dateB - dateA;
        });

        // Show only latest 5 activities
        setRecentActivities(
          activities.slice(0, 5)
        );

      } catch (error) {
        console.error(
          "Failed to load dashboard data:",
          error
        );
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ================================
  // Today's Date
  // ================================

  const today = new Date()
    .toISOString()
    .split("T")[0];

  // ================================
  // Present Today
  // ================================

  const presentToday = attendance.filter(
    (record) =>
      record.attendanceDate === today &&
      record.status?.toLowerCase() === "present"
  ).length;

  // ================================
  // Pending Leaves
  // ================================

  const pendingLeaves = leaves.filter(
    (leave) =>
      leave.status?.toLowerCase() === "pending"
  ).length;

  // ================================
  // Payroll Records
  // ================================

  const payrollCount = payrolls.length;

  return (
    <div className="dashboard-page">

      {/* ================================
          Sidebar
      ================================= */}

      <aside className="sidebar">

        {/* Logo */}

        <div className="sidebar-logo">

          <div className="sidebar-logo-icon">
            S
          </div>

          <span>
            SmartHR
          </span>

        </div>


        {/* Navigation */}

        <nav className="sidebar-nav">

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <span>▦</span>
            Dashboard
          </NavLink>


          <NavLink
            to="/employees"
            className={({ isActive }) =>
              `nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <span>♙</span>
            Employees
          </NavLink>


          <NavLink
            to="/attendance"
            className={({ isActive }) =>
              `nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <span>◷</span>
            Attendance
          </NavLink>


          <NavLink
            to="/leave"
            className={({ isActive }) =>
              `nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <span>▣</span>
            Leave
          </NavLink>


          <NavLink
            to="/payroll"
            className={({ isActive }) =>
              `nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <span>₹</span>
            Payroll
          </NavLink>

        </nav>


        {/* Logout */}

        <div className="sidebar-logout">

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>


      {/* ================================
          Main Area
      ================================= */}

      <main className="dashboard-main">


        {/* ================================
            Header
        ================================= */}

        <header className="dashboard-header">

          <div>

            <h1>
              Dashboard
            </h1>

            <p>
              Welcome back to SmartHR.
            </p>

          </div>


          {/* User Profile */}

          <div className="user-profile">

            <div className="user-avatar">

              {user?.fullName
                ?.charAt(0)
                .toUpperCase() || "U"}

            </div>


            <div className="user-info">

              <strong>
                {user?.fullName || "User"}
              </strong>

              <span>
                {user?.role || "Employee"}
              </span>

            </div>

          </div>

        </header>


        {/* ================================
            Statistics
        ================================= */}

        <section className="stats-grid">


          {/* Total Employees */}

          <div className="stat-card">

            <div className="stat-icon employees-icon">
              👥
            </div>

            <div>

              <span>
                Total Employees
              </span>

              <strong>
                {loadingStats
                  ? "..."
                  : employees.length}
              </strong>

            </div>

          </div>


          {/* Present Today */}

          <div className="stat-card">

            <div className="stat-icon attendance-icon">
              ✓
            </div>

            <div>

              <span>
                Present Today
              </span>

              <strong>
                {loadingStats
                  ? "..."
                  : presentToday}
              </strong>

            </div>

          </div>


          {/* Pending Leaves */}

          <div className="stat-card">

            <div className="stat-icon leave-icon">
              ◷
            </div>

            <div>

              <span>
                Pending Leaves
              </span>

              <strong>
                {loadingStats
                  ? "..."
                  : pendingLeaves}
              </strong>

            </div>

          </div>


          {/* Payroll Records */}

          <div className="stat-card">

            <div className="stat-icon payroll-icon">
              ₹
            </div>

            <div>

              <span>
                Payroll Records
              </span>

              <strong>
                {loadingStats
                  ? "..."
                  : payrollCount}
              </strong>

            </div>

          </div>

        </section>


        {/* ================================
            Welcome Card
        ================================= */}

        <section className="welcome-card">

          <div>

            <span className="welcome-label">
              SMART HR MANAGEMENT
            </span>


            <h2>
              Welcome,{" "}
              {user?.fullName || "User"}!
            </h2>


            <p>
              Manage your employees, attendance,
              leaves, and payroll from one
              centralized dashboard.
            </p>

          </div>


          <div className="welcome-decoration">
            S
          </div>

        </section>


        {/* ================================
            Recent Activity
        ================================= */}

        <section className="content-card">

          <div className="content-card-header">

            <div>

              <h2>
                Recent Activity
              </h2>

              <p>
                Your latest HR activities will
                appear here.
              </p>

            </div>

          </div>


          {/* Loading */}

          {loadingStats && (

            <div className="empty-state">

              <div className="empty-icon">
                ◌
              </div>

              <p>
                Loading recent activities...
              </p>

            </div>

          )}


          {/* No Activities */}

          {!loadingStats &&
            recentActivities.length === 0 && (

              <div className="empty-state">

                <div className="empty-icon">
                  ◌
                </div>

                <h3>
                  No recent activity
                </h3>

                <p>
                  There are no recent activities
                  to display.
                </p>

              </div>

            )}


          {/* Activities */}

          {!loadingStats &&
            recentActivities.length > 0 && (

              <div className="activity-list">

                {recentActivities.map(
                  (activity, index) => (

                    <div
                      className="activity-item"
                      key={`${activity.type}-${activity.date}-${index}`}
                    >

                      <div className="activity-icon">
                        {activity.icon}
                      </div>


                      <div className="activity-details">

                        <strong>
                          {activity.title}
                        </strong>

                        <span>
                          {activity.date
                            ? new Date(
                                activity.date
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : "-"}
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

        </section>

      </main>

    </div>
  );
}

export default Dashboard;