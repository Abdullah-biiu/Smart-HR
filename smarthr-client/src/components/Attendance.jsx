import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./Attendance.css";

function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = user?.role === "Admin";

  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: "",
    attendanceDate: "",
    checkIn: "",
    checkOut: "",
    status: "Present",
    remarks: "",
  });

  const getErrorMessage = (err, fallback) => {
    const data = err?.response?.data;

    if (data?.message) {
      return data.message;
    }

    if (data?.errors) {
      const validationErrors = Object.values(data.errors)
        .flat()
        .filter(Boolean);

      if (validationErrors.length > 0) {
        return validationErrors.join(" ");
      }
    }

    if (data?.title) {
      return data.title;
    }

    return fallback;
  };

  const resolveCurrentEmployeeId = (employeeList, attendanceList) => {
    if (isAdmin) {
      return null;
    }

    const possibleId =
      user?.employeeId ??
      user?.EmployeeId ??
      user?.employeeID ??
      user?.EmployeeID;

    if (possibleId) {
      const numericId = Number(possibleId);

      if (
        Number.isInteger(numericId) &&
        employeeList.some((employee) => employee.id === numericId)
      ) {
        return numericId;
      }
    }

    const possibleEmail = user?.email ?? user?.Email;

    if (possibleEmail) {
      const employeeByEmail = employeeList.find(
        (employee) =>
          employee.email?.toLowerCase() ===
          possibleEmail.toLowerCase()
      );

      if (employeeByEmail) {
        return employeeByEmail.id;
      }
    }

    const possibleCode =
      user?.employeeCode ??
      user?.EmployeeCode;

    if (possibleCode) {
      const employeeByCode = employeeList.find(
        (employee) =>
          employee.employeeCode?.toLowerCase() ===
          possibleCode.toLowerCase()
      );

      if (employeeByCode) {
        return employeeByCode.id;
      }
    }

    /*
     * For Employee users, /Attendance already returns only
     * their own records. If all returned records belong to one
     * employee, we can safely determine the employee ID.
     */
    const employeeIds = [
      ...new Set(
        attendanceList
          .map((record) => Number(record.employeeId))
          .filter((id) => Number.isInteger(id) && id > 0)
      ),
    ];

    if (employeeIds.length === 1) {
      return employeeIds[0];
    }

    return null;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [attendanceResponse, employeesResponse] =
        await Promise.all([
          api.get("/Attendance"),
          api.get("/Employees"),
        ]);

      const attendanceData = Array.isArray(attendanceResponse.data)
        ? attendanceResponse.data
        : [];

      const employeeData = Array.isArray(employeesResponse.data)
        ? employeesResponse.data
        : [];

      setAttendance(attendanceData);
      setEmployees(employeeData);

      const resolvedId = resolveCurrentEmployeeId(
        employeeData,
        attendanceData
      );

      setCurrentEmployeeId(resolvedId);
    } catch (err) {
      console.error("Failed to load attendance:", err);

      setError(
        getErrorMessage(
          err,
          "Failed to load attendance data."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const employeeMap = useMemo(() => {
    const map = new Map();

    employees.forEach((employee) => {
      map.set(employee.id, employee);
    });

    return map;
  }, [employees]);

  const getEmployee = (employeeId) => {
    return employeeMap.get(Number(employeeId));
  };

  const getEmployeeName = (employeeId) => {
    const employee = getEmployee(employeeId);

    if (!employee) {
      return `Employee #${employeeId}`;
    }

    return `${employee.firstName || ""} ${
      employee.lastName || ""
    }`.trim();
  };

  const getEmployeeCode = (employeeId) => {
    const employee = getEmployee(employeeId);

    return employee?.employeeCode || `EMP-${employeeId}`;
  };

  const getEmployeeInitial = (employeeId) => {
    const employee = getEmployee(employeeId);

    if (employee?.firstName) {
      return employee.firstName.charAt(0).toUpperCase();
    }

    return "E";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const parts = dateValue.split("-");

    if (parts.length !== 3) {
      return dateValue;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatTime = (timeValue) => {
    if (!timeValue) {
      return "-";
    }

    const parts = timeValue.split(":");

    if (parts.length < 2) {
      return timeValue;
    }

    const hours = Number(parts[0]);
    const minutes = parts[1];

    if (Number.isNaN(hours)) {
      return timeValue;
    }

    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    return `${String(displayHour).padStart(
      2,
      "0"
    )}:${minutes} ${suffix}`;
  };

  const formatTimeForApi = (timeValue) => {
    if (!timeValue) {
      return null;
    }

    if (timeValue.length === 5) {
      return `${timeValue}:00`;
    }

    return timeValue;
  };

  const getStatusClass = (status) => {
    const normalizedStatus = status
      ?.toLowerCase()
      .trim();

    if (normalizedStatus === "present") {
      return "present";
    }

    if (normalizedStatus === "absent") {
      return "absent";
    }

    if (normalizedStatus === "late") {
      return "late";
    }

    if (
      normalizedStatus === "half day" ||
      normalizedStatus === "half-day"
    ) {
      return "half-day";
    }

    return "other";
  };

  const filteredAttendance = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return attendance.filter((record) => {
      const employeeName = getEmployeeName(
        record.employeeId
      ).toLowerCase();

      const employeeCode = getEmployeeCode(
        record.employeeId
      ).toLowerCase();

      const recordDate = (
        record.attendanceDate || ""
      ).toLowerCase();

      const status = (
        record.status || ""
      ).toLowerCase();

      const remarks = (
        record.remarks || ""
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        employeeName.includes(searchValue) ||
        employeeCode.includes(searchValue) ||
        recordDate.includes(searchValue) ||
        status.includes(searchValue) ||
        remarks.includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [
    attendance,
    employees,
    search,
    statusFilter,
  ]);

  const presentCount = attendance.filter(
    (record) =>
      record.status?.toLowerCase() === "present"
  ).length;

  const absentCount = attendance.filter(
    (record) =>
      record.status?.toLowerCase() === "absent"
  ).length;

  const openAddForm = () => {
    setEditingAttendance(null);
    setFormError("");
    setError("");
    setSuccessMessage("");

    if (!isAdmin && !currentEmployeeId) {
      setFormError(
        "Your employee record could not be determined. Please contact the administrator."
      );
    }

    setFormData({
      employeeId: isAdmin
        ? ""
        : currentEmployeeId
          ? String(currentEmployeeId)
          : "",
      attendanceDate: new Date()
        .toISOString()
        .split("T")[0],
      checkIn: "",
      checkOut: "",
      status: "Present",
      remarks: "",
    });

    setShowForm(true);
  };

  const openEditForm = (record) => {
    setEditingAttendance(record);
    setSelectedAttendance(null);
    setFormError("");
    setError("");
    setSuccessMessage("");

    setFormData({
      employeeId: String(record.employeeId),
      attendanceDate:
        record.attendanceDate || "",
      checkIn: record.checkIn
        ? record.checkIn.substring(0, 5)
        : "",
      checkOut: record.checkOut
        ? record.checkOut.substring(0, 5)
        : "",
      status: record.status || "Present",
      remarks: record.remarks || "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingAttendance(null);
    setFormError("");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const employeeId = isAdmin
      ? Number(formData.employeeId)
      : Number(currentEmployeeId);

    if (!employeeId) {
      setFormError("Please select an employee.");
      return;
    }

    if (!formData.attendanceDate) {
      setFormError("Please select an attendance date.");
      return;
    }

    if (!formData.status.trim()) {
      setFormError("Please select an attendance status.");
      return;
    }

    if (
      formData.checkIn &&
      formData.checkOut &&
      formData.checkOut < formData.checkIn
    ) {
      setFormError(
        "Check-out time cannot be earlier than check-in time."
      );
      return;
    }

    const payload = {
      employeeId,
      attendanceDate: formData.attendanceDate,
      checkIn: formatTimeForApi(formData.checkIn),
      checkOut: formatTimeForApi(formData.checkOut),
      status: formData.status.trim(),
      remarks: formData.remarks.trim(),
    };

    try {
      setSaving(true);

      if (editingAttendance) {
        await api.put(
          `/Attendance/${editingAttendance.id}`,
          payload
        );

        setSuccessMessage(
          "Attendance updated successfully."
        );
      } else {
        await api.post("/Attendance", payload);

        setSuccessMessage(
          "Attendance added successfully."
        );
      }

      await fetchData();

      setShowForm(false);
      setEditingAttendance(null);

      setFormData({
        employeeId: isAdmin
          ? ""
          : currentEmployeeId
            ? String(currentEmployeeId)
            : "",
        attendanceDate: new Date()
          .toISOString()
          .split("T")[0],
        checkIn: "",
        checkOut: "",
        status: "Present",
        remarks: "",
      });
    } catch (err) {
      console.error(
        "Failed to save attendance:",
        err
      );

      setFormError(
        getErrorMessage(
          err,
          "Failed to save attendance."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!isAdmin) {
      return;
    }

    const employeeName = getEmployeeName(
      record.employeeId
    );

    const confirmed = window.confirm(
      `Delete attendance for ${employeeName} on ${formatDate(
        record.attendanceDate
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccessMessage("");

      await api.delete(`/Attendance/${record.id}`);

      setSelectedAttendance(null);

      await fetchData();

      setSuccessMessage(
        "Attendance deleted successfully."
      );
    } catch (err) {
      console.error(
        "Failed to delete attendance:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to delete attendance."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="attendance-page">

      {/* HEADER */}

      <div className="attendance-header">

        <div>
          <h1>Attendance</h1>

          <p>
            View and monitor employee attendance
            records.
          </p>
        </div>

        <button
          className="attendance-add-button"
          onClick={openAddForm}
        >
          <span>+</span>
          Add Attendance
        </button>

      </div>

      {/* SUMMARY */}

      <div className="attendance-summary">

        <div className="attendance-summary-card">
          <span>Total Records</span>
          <strong>{attendance.length}</strong>
        </div>

        <div className="attendance-summary-card present-summary">
          <span>Present</span>
          <strong>{presentCount}</strong>
        </div>

        <div className="attendance-summary-card absent-summary">
          <span>Absent</span>
          <strong>{absentCount}</strong>
        </div>

      </div>

      {/* SUCCESS */}

      {successMessage && (
        <div className="attendance-success">
          <strong>Success</strong>
          <span>{successMessage}</span>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="attendance-error">
          <strong>Unable to complete request</strong>
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* FORM */}

      {showForm && (
        <div className="attendance-form-card">

          <div className="attendance-form-header">

            <div>
              <h2>
                {editingAttendance
                  ? "Edit Attendance"
                  : "Add Attendance"}
              </h2>

              <p>
                Enter the attendance information
                below.
              </p>
            </div>

            <button
              type="button"
              className="attendance-close-button"
              onClick={closeForm}
              disabled={saving}
            >
              ×
            </button>

          </div>

          {formError && (
            <div className="attendance-form-error">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="attendance-form-grid">

              {/* EMPLOYEE */}

              <div className="attendance-field">

                <label>
                  Employee
                  <span>*</span>
                </label>

                {isAdmin ? (
                  <select
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    disabled={saving}
                    required
                  >
                    <option value="">
                      Select employee
                    </option>

                    {employees.map((employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.employeeCode} -{" "}
                        {employee.firstName}{" "}
                        {employee.lastName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={
                      currentEmployeeId
                        ? `${getEmployeeCode(
                            currentEmployeeId
                          )} - ${getEmployeeName(
                            currentEmployeeId
                          )}`
                        : "Employee record not found"
                    }
                    disabled
                  />
                )}

              </div>

              {/* DATE */}

              <div className="attendance-field">

                <label>
                  Attendance Date
                  <span>*</span>
                </label>

                <input
                  type="date"
                  name="attendanceDate"
                  value={formData.attendanceDate}
                  onChange={handleInputChange}
                  disabled={saving}
                  required
                />

              </div>

              {/* CHECK IN */}

              <div className="attendance-field">

                <label>Check In</label>

                <input
                  type="time"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleInputChange}
                  disabled={saving}
                />

              </div>

              {/* CHECK OUT */}

              <div className="attendance-field">

                <label>Check Out</label>

                <input
                  type="time"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleInputChange}
                  disabled={saving}
                />

              </div>

              {/* STATUS */}

              <div className="attendance-field">

                <label>
                  Status
                  <span>*</span>
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={saving}
                  required
                >
                  <option value="Present">
                    Present
                  </option>

                  <option value="Absent">
                    Absent
                  </option>

                  <option value="Late">
                    Late
                  </option>

                  <option value="Half Day">
                    Half Day
                  </option>
                </select>

              </div>

              {/* REMARKS */}

              <div className="attendance-field attendance-field-full">

                <label>Remarks</label>

                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Enter remarks if required..."
                  rows="3"
                  disabled={saving}
                />

              </div>

            </div>

            <div className="attendance-form-actions">

              <button
                type="button"
                className="attendance-cancel-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="attendance-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingAttendance
                    ? "Update Attendance"
                    : "Save Attendance"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="attendance-message">

          <div className="attendance-spinner"></div>

          <span>
            Loading attendance...
          </span>

        </div>
      )}

      {/* EMPTY */}

      {!loading &&
        !error &&
        attendance.length === 0 && (
          <div className="attendance-message">

            <div className="attendance-empty-icon">
              ◷
            </div>

            <h3>
              No attendance records
            </h3>

            <p>
              There are currently no attendance
              records available.
            </p>

            <button
              className="attendance-empty-button"
              onClick={openAddForm}
            >
              Add First Attendance
            </button>

          </div>
        )}

      {/* TABLE */}

      {!loading &&
        !error &&
        attendance.length > 0 && (
          <div className="attendance-card">

            {/* TOOLBAR */}

            <div className="attendance-toolbar">

              <div className="attendance-search">

                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search employee, date, status..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                  >
                    ×
                  </button>
                )}

              </div>

              <select
                className="attendance-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All Status
                </option>

                <option value="Present">
                  Present
                </option>

                <option value="Absent">
                  Absent
                </option>

                <option value="Late">
                  Late
                </option>

                <option value="Half Day">
                  Half Day
                </option>
              </select>

            </div>

            {/* NO SEARCH RESULTS */}

            {filteredAttendance.length === 0 && (
              <div className="attendance-no-results">

                <div className="attendance-empty-icon">
                  ⌕
                </div>

                <h3>
                  No matching records
                </h3>

                <p>
                  Try changing your search or
                  status filter.
                </p>

              </div>
            )}

            {/* TABLE */}

            {filteredAttendance.length > 0 && (
              <div className="attendance-table-wrapper">

                <table className="attendance-table">

                  <thead>

                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th>Remarks</th>
                      <th>Actions</th>
                    </tr>

                  </thead>

                  <tbody>

                    {filteredAttendance.map(
                      (record) => {

                        const statusClass =
                          getStatusClass(
                            record.status
                          );

                        return (
                          <tr
                            key={record.id}
                            onClick={() =>
                              setSelectedAttendance(
                                record
                              )
                            }
                          >

                            {/* EMPLOYEE */}

                            <td>

                              <div className="attendance-employee">

                                <div className="attendance-avatar">
                                  {getEmployeeInitial(
                                    record.employeeId
                                  )}
                                </div>

                                <div className="attendance-employee-name">

                                  <strong>
                                    {getEmployeeName(
                                      record.employeeId
                                    )}
                                  </strong>

                                  <span>
                                    {getEmployeeCode(
                                      record.employeeId
                                    )}
                                  </span>

                                </div>

                              </div>

                            </td>

                            {/* DATE */}

                            <td>
                              {formatDate(
                                record.attendanceDate
                              )}
                            </td>

                            {/* CHECK IN */}

                            <td>
                              <span className="time-value">
                                {formatTime(
                                  record.checkIn
                                )}
                              </span>
                            </td>

                            {/* CHECK OUT */}

                            <td>
                              <span className="time-value">
                                {formatTime(
                                  record.checkOut
                                )}
                              </span>
                            </td>

                            {/* STATUS */}

                            <td>

                              <span
                                className={`attendance-status ${statusClass}`}
                              >

                                <span className="attendance-status-dot"></span>

                                {record.status ||
                                  "Unknown"}

                              </span>

                            </td>

                            {/* REMARKS */}

                            <td>

                              <span className="attendance-remarks">
                                {record.remarks ||
                                  "-"}
                              </span>

                            </td>

                            {/* ACTIONS */}

                            <td
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                            >

                              <div className="attendance-actions">

                                <button
                                  type="button"
                                  className="attendance-edit-button"
                                  onClick={() =>
                                    openEditForm(
                                      record
                                    )
                                  }
                                >
                                  Edit
                                </button>

                                {isAdmin && (
                                  <button
                                    type="button"
                                    className="attendance-delete-button"
                                    onClick={() =>
                                      handleDelete(
                                        record
                                      )
                                    }
                                    disabled={deleting}
                                  >
                                    Delete
                                  </button>
                                )}

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>
        )}

      {/* DETAILS MODAL */}

      {selectedAttendance && (
        <div
          className="attendance-modal-overlay"
          onClick={() =>
            setSelectedAttendance(null)
          }
        >

          <div
            className="attendance-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="attendance-modal-header">

              <div>
                <h2>
                  Attendance Details
                </h2>

                <p>
                  Attendance record #
                  {selectedAttendance.id}
                </p>
              </div>

              <button
                type="button"
                className="attendance-close-button"
                onClick={() =>
                  setSelectedAttendance(null)
                }
              >
                ×
              </button>

            </div>

            <div className="attendance-detail-employee">

              <div className="attendance-avatar large">
                {getEmployeeInitial(
                  selectedAttendance.employeeId
                )}
              </div>

              <div>
                <strong>
                  {getEmployeeName(
                    selectedAttendance.employeeId
                  )}
                </strong>

                <span>
                  {getEmployeeCode(
                    selectedAttendance.employeeId
                  )}
                </span>
              </div>

            </div>

            <div className="attendance-details-grid">

              <div>
                <span>Date</span>
                <strong>
                  {formatDate(
                    selectedAttendance.attendanceDate
                  )}
                </strong>
              </div>

              <div>
                <span>Status</span>

                <strong>
                  <span
                    className={`attendance-status ${getStatusClass(
                      selectedAttendance.status
                    )}`}
                  >
                    <span className="attendance-status-dot"></span>
                    {selectedAttendance.status ||
                      "Unknown"}
                  </span>
                </strong>
              </div>

              <div>
                <span>Check In</span>
                <strong>
                  {formatTime(
                    selectedAttendance.checkIn
                  )}
                </strong>
              </div>

              <div>
                <span>Check Out</span>
                <strong>
                  {formatTime(
                    selectedAttendance.checkOut
                  )}
                </strong>
              </div>

              <div className="attendance-detail-full">
                <span>Remarks</span>
                <strong>
                  {selectedAttendance.remarks ||
                    "No remarks"}
                </strong>
              </div>

            </div>

            <div className="attendance-modal-actions">

              <button
                type="button"
                className="attendance-cancel-button"
                onClick={() =>
                  setSelectedAttendance(null)
                }
              >
                Close
              </button>

              <button
                type="button"
                className="attendance-edit-button large-button"
                onClick={() =>
                  openEditForm(
                    selectedAttendance
                  )
                }
              >
                Edit Attendance
              </button>

              {isAdmin && (
                <button
                  type="button"
                  className="attendance-delete-button large-button"
                  onClick={() =>
                    handleDelete(
                      selectedAttendance
                    )
                  }
                  disabled={deleting}
                >
                  {deleting
                    ? "Deleting..."
                    : "Delete"}
                </button>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Attendance;