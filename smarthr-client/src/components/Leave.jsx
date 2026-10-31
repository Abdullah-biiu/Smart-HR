import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./Leave.css";

function Leave() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isAdmin = user?.role === "Admin";

  const employeeId =
    user?.employeeId ??
    user?.employee?.id ??
    null;

  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    leaveType: "Casual",
    reason: "",
  });

  // Fetch leave records
  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/Leaves");

      setLeaves(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load leaves:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load leave records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Statistics
  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter(
      l => l.status?.toLowerCase() === "pending"
    ).length,
    approved: leaves.filter(
      l => l.status?.toLowerCase() === "approved"
    ).length,
    rejected: leaves.filter(
      l => l.status?.toLowerCase() === "rejected"
    ).length,
  }), [leaves]);

  // Search and filter
  const filteredLeaves = leaves.filter(leave => {
    const employeeName = leave.employee
      ? `${leave.employee.firstName || ""} ${leave.employee.lastName || ""}`
      : `Employee ${leave.employeeId}`;

    const matchesSearch =
      employeeName.toLowerCase().includes(search.toLowerCase()) ||
      String(leave.employeeId).includes(search);

    const matchesStatus =
      filterStatus === "All" ||
      leave.status?.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Handle form changes
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Apply for leave
  const handleApplyLeave = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!employeeId) {
      setError(
        "Employee ID is missing from your login information. Please check your authentication response."
      );
      return;
    }

    if (form.endDate < form.startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        employeeId: Number(employeeId),
        startDate: form.startDate,
        endDate: form.endDate,
        leaveType: form.leaveType,
        reason: form.reason.trim(),
        status: "Pending",
        remarks: "",
      };

      await api.post("/Leaves", payload);

      setSuccess("Leave application submitted successfully!");

      setShowModal(false);

      setForm({
        startDate: "",
        endDate: "",
        leaveType: "Casual",
        reason: "",
      });

      await fetchLeaves();

    } catch (error) {
      console.error("Leave application failed:", error);

      setError(
        error.response?.data?.message ||
          "Unable to submit leave application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Approve or reject leave
  const handleStatusUpdate = async (status) => {
    if (!selectedLeave) return;

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = {
        employeeId: selectedLeave.employeeId,
        startDate: selectedLeave.startDate,
        endDate: selectedLeave.endDate,
        leaveType: selectedLeave.leaveType,
        status: status,
        reason: selectedLeave.reason || "",
        remarks: remarks.trim(),
      };

      await api.put(
        `/Leaves/${selectedLeave.id}`,
        payload
      );

      setSuccess(`Leave ${status.toLowerCase()} successfully!`);

      setSelectedLeave(null);
      setRemarks("");

      await fetchLeaves();

    } catch (error) {
      console.error("Failed to update leave:", error);

      setError(
        error.response?.data?.message ||
          "Unable to update leave status."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete leave
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this leave application?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/Leaves/${id}`);

      setSuccess("Leave application deleted successfully.");

      await fetchLeaves();

    } catch (error) {
      console.error("Delete failed:", error);

      setError(
        error.response?.data?.message ||
          "Unable to delete leave application."
      );
    }
  };

  const getEmployeeName = (leave) => {
    if (leave.employee) {
      return `${leave.employee.firstName || ""} ${
        leave.employee.lastName || ""
      }`.trim();
    }

    return `Employee #${leave.employeeId}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date + "T00:00:00").toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div className="leave-page">

      {/* Header */}

      <div className="leave-header">

        <div>
          <h1>Leave Management</h1>

          <p>
            {isAdmin
              ? "Manage employee leave applications and approvals."
              : "Apply for leave and track your applications."}
          </p>
        </div>

        {!isAdmin && (
          <button
            className="leave-primary-btn"
            onClick={() => {
              setError("");
              setShowModal(true);
            }}
          >
            + Apply for Leave
          </button>
        )}

      </div>

      {/* Alerts */}

      {error && (
        <div className="leave-alert error-alert">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {success && (
        <div className="leave-alert success-alert">
          {success}
          <button onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {/* Statistics */}

      <div className="leave-stats">

        <div className="leave-stat-card">
          <div className="stat-icon total-icon">▤</div>
          <div>
            <span>Total Applications</span>
            <h2>{stats.total}</h2>
          </div>
        </div>

        <div className="leave-stat-card">
          <div className="stat-icon pending-icon">◷</div>
          <div>
            <span>Pending</span>
            <h2>{stats.pending}</h2>
          </div>
        </div>

        <div className="leave-stat-card">
          <div className="stat-icon approved-icon">✓</div>
          <div>
            <span>Approved</span>
            <h2>{stats.approved}</h2>
          </div>
        </div>

        <div className="leave-stat-card">
          <div className="stat-icon rejected-icon">×</div>
          <div>
            <span>Rejected</span>
            <h2>{stats.rejected}</h2>
          </div>
        </div>

      </div>

      {/* Leave Table */}

      <div className="leave-card">

        <div className="leave-toolbar">

          <div>
            <h3>Leave Applications</h3>
            <p>Manage and monitor leave records.</p>
          </div>

          <div className="leave-controls">

            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="leave-search"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="leave-filter"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

          </div>

        </div>

        {loading ? (

          <div className="leave-message">
            <div className="leave-spinner"></div>
            Loading leave records...
          </div>

        ) : filteredLeaves.length === 0 ? (

          <div className="leave-message">

            <div className="leave-empty-icon">◷</div>

            <h3>No leave records found</h3>

            <p>
              No applications match your current search or filter.
            </p>

          </div>

        ) : (

          <div className="leave-table-wrapper">

            <table className="leave-table">

              <thead>
                <tr>
                  {isAdmin && <th>Employee</th>}
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Leave Type</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Remarks</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>

                {filteredLeaves.map((leave) => (

                  <tr key={leave.id}>

                    {isAdmin && (
                      <td>
                        <div className="leave-employee">

                          <div className="leave-avatar">
                            {getEmployeeName(leave)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="leave-employee-name">

                            <strong>
                              {getEmployeeName(leave)}
                            </strong>

                            <span>
                              ID: {leave.employeeId}
                            </span>

                          </div>

                        </div>
                      </td>
                    )}

                    <td>{formatDate(leave.startDate)}</td>

                    <td>{formatDate(leave.endDate)}</td>

                    <td>
                      <span className="leave-type">
                        {leave.leaveType}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`leave-status ${getStatusClass(
                          leave.status
                        )}`}
                      >
                        <span className="leave-status-dot"></span>
                        {leave.status}
                      </span>
                    </td>

                    <td className="leave-reason">
                      {leave.reason || "-"}
                    </td>

                    <td>
                      {leave.remarks || "-"}
                    </td>

                    {isAdmin && (
                      <td>
                        <div className="leave-actions">

                          {leave.status?.toLowerCase() === "pending" && (
                            <button
                              className="approve-btn"
                              onClick={() => {
                                setSelectedLeave(leave);
                                setRemarks("");
                              }}
                              title="Review application"
                            >
                              Review
                            </button>
                          )}

                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(leave.id)}
                            title="Delete application"
                          >
                            Delete
                          </button>

                        </div>
                      </td>
                    )}

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* Apply Leave Modal */}

      {showModal && (

        <div className="leave-modal-overlay">

          <div className="leave-modal">

            <div className="leave-modal-header">

              <div>
                <h2>Apply for Leave</h2>
                <p>Submit your leave application.</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleApplyLeave}>

              <div className="leave-form-group">

                <label>Leave Type</label>

                <select
                  name="leaveType"
                  value={form.leaveType}
                  onChange={handleChange}
                  required
                >
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Earned">Earned Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>

              </div>

              <div className="leave-form-row">

                <div className="leave-form-group">

                  <label>Start Date</label>

                  <input
                    type="date"
                    name="startDate"
                    min={new Date().toLocaleDateString("en-CA")}
                    value={form.startDate}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="leave-form-group">

                  <label>End Date</label>

                  <input
                    type="date"
                    name="endDate"
                    min={form.startDate || new Date().toLocaleDateString("en-CA")}
                    value={form.endDate}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>

              <div className="leave-form-group">

                <label>Reason for Leave</label>

                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Enter your reason for leave..."
                  rows="4"
                  required
                />

              </div>

              <div className="leave-modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="leave-primary-btn"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* Admin Review Modal */}

      {selectedLeave && (

        <div className="leave-modal-overlay">

          <div className="leave-modal">

            <div className="leave-modal-header">

              <div>
                <h2>Review Leave Application</h2>
                <p>{getEmployeeName(selectedLeave)}</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setSelectedLeave(null)}
              >
                ×
              </button>

            </div>

            <div className="leave-review-details">

              <p>
                <strong>Leave Type:</strong>{" "}
                {selectedLeave.leaveType}
              </p>

              <p>
                <strong>Duration:</strong>{" "}
                {formatDate(selectedLeave.startDate)} -{" "}
                {formatDate(selectedLeave.endDate)}
              </p>

              <p>
                <strong>Reason:</strong>{" "}
                {selectedLeave.reason || "-"}
              </p>

            </div>

            <div className="leave-form-group">

              <label>Approval Remarks</label>

              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks (optional)..."
                rows="3"
              />

            </div>

            <div className="leave-modal-actions">

              <button
                className="reject-action"
                disabled={submitting}
                onClick={() => handleStatusUpdate("Rejected")}
              >
                Reject
              </button>

              <button
                className="approve-action"
                disabled={submitting}
                onClick={() => handleStatusUpdate("Approved")}
              >
                {submitting ? "Processing..." : "Approve"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case "approved":
      return "approved";

    case "rejected":
      return "rejected";

    default:
      return "pending";
  }
}

export default Leave;