import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./Payroll.css";

const initialForm = {
  employeeId: "",
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  basicSalary: "",
  allowances: 0,
  deductions: 0,
  status: "Pending",
  paymentDate: "",
  remarks: "",
};

const months = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function getErrorMessage(error) {
  const data = error.response?.data;

  if (data?.message) return data.message;
  if (data?.title) return data.title;

  if (data?.errors) {
    return Object.values(data.errors).flat().join(" ");
  }

  return "Something went wrong. Please try again.";
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case "paid":
      return "paid";

    case "cancelled":
    case "canceled":
      return "cancelled";

    default:
      return "pending";
  }
}

function Payroll() {
  const user = getUser();
  const isAdmin = user.role?.toLowerCase() === "admin";

  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch payroll records
  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/Payrolls");

      setPayrolls(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Failed to load payroll:", error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for Admin payroll generation
  const fetchEmployees = async () => {
    try {
      const response = await api.get("/Employees");

      setEmployees(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Failed to load employees:", error);
    }
  };

  useEffect(() => {
    fetchPayrolls();

    if (isAdmin) {
      fetchEmployees();
    }
  }, []);

  // Salary calculation
  const netSalary =
    Number(form.basicSalary || 0) +
    Number(form.allowances || 0) -
    Number(form.deductions || 0);

  // Payroll statistics
  const stats = useMemo(() => {
    const paid = payrolls.filter(
      (p) => p.status?.toLowerCase() === "paid"
    );

    const pending = payrolls.filter(
      (p) => p.status?.toLowerCase() === "pending"
    );

    const cancelled = payrolls.filter(
      (p) => p.status?.toLowerCase() === "cancelled"
    );

    return {
      total: payrolls.length,

      paid: paid.length,

      pending: pending.length,

      totalPaid: paid.reduce(
        (sum, p) => sum + Number(p.netSalary || 0),
        0
      ),

      totalPayroll: payrolls.reduce(
        (sum, p) => sum + Number(p.netSalary || 0),
        0
      ),

      cancelled: cancelled.length,
    };
  }, [payrolls]);

  // Search and filter
  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((payroll) => {
      const employeeName =
        payroll.employeeName || "";

      const employeeCode =
        payroll.employeeCode || "";

      const searchMatch =
        employeeName.toLowerCase().includes(search.toLowerCase()) ||
        employeeCode.toLowerCase().includes(search.toLowerCase()) ||
        String(payroll.employeeId).includes(search);

      const statusMatch =
        statusFilter === "All" ||
        payroll.status?.toLowerCase() ===
          statusFilter.toLowerCase();

      return searchMatch && statusMatch;
    });
  }, [payrolls, search, statusFilter]);

  // Open create modal
  const handleAdd = () => {
    setEditingPayroll(null);
    setForm({ ...initialForm });
    setFormError("");
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (payroll) => {
    setEditingPayroll(payroll);

    setForm({
      employeeId: payroll.employeeId,
      year: payroll.year,
      month: payroll.month,
      basicSalary: payroll.basicSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      status: payroll.status,
      paymentDate: payroll.paymentDate
        ? String(payroll.paymentDate).slice(0, 10)
        : "",
      remarks: payroll.remarks || "",
    });

    setFormError("");
    setShowModal(true);
  };

  // Form input handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create or update payroll
  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    const basic = Number(form.basicSalary);
    const allowances = Number(form.allowances);
    const deductions = Number(form.deductions);

    if (!editingPayroll && !form.employeeId) {
      setFormError("Please select an employee.");
      return;
    }

    if (
      !Number.isFinite(basic) ||
      !Number.isFinite(allowances) ||
      !Number.isFinite(deductions) ||
      basic < 0 ||
      allowances < 0 ||
      deductions < 0
    ) {
      setFormError("Please enter valid non-negative salary amounts.");
      return;
    }

    if (deductions > basic + allowances) {
      setFormError(
        "Deductions cannot exceed basic salary and allowances."
      );
      return;
    }

    if (form.status === "Paid" && !form.paymentDate) {
      setFormError("Payment date is required for paid payroll.");
      return;
    }

    const paymentDate = form.paymentDate
      ? `${form.paymentDate}T00:00:00.000Z`
      : null;

    const payload = {
      basicSalary: basic,
      allowances,
      deductions,
      status: form.status,
      paymentDate,
      remarks: form.remarks || "",
    };

    try {
      setSaving(true);

      if (editingPayroll) {
        await api.put(
          `/Payrolls/${editingPayroll.id}`,
          payload
        );
      } else {
        await api.post("/Payrolls", {
          ...payload,
          employeeId: Number(form.employeeId),
          year: Number(form.year),
          month: Number(form.month),
        });
      }

      setShowModal(false);
      setEditingPayroll(null);
      setForm({ ...initialForm });

      await fetchPayrolls();
    } catch (error) {
      console.error("Payroll save failed:", error);
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Delete payroll
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payroll record?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/Payrolls/${id}`);
      await fetchPayrolls();
    } catch (error) {
      alert(getErrorMessage(error));
    }
  };

  // Format payroll period
  const getPeriod = (month, year) => {
    return `${months[month - 1] || month} ${year}`;
  };

  return (
    <div className="payroll-page">

      {/* Header */}
      <div className="payroll-header">

        <div>
          <span className="payroll-eyebrow">
            {isAdmin ? "ADMINISTRATION" : "MY ACCOUNT"}
          </span>

          <h1>Payroll Management</h1>

          <p>
            {isAdmin
              ? "Manage employee salaries and monthly payroll records."
              : "View your salary details and payment history."}
          </p>
        </div>

        {isAdmin && (
          <button
            className="payroll-primary-btn"
            onClick={handleAdd}
          >
            <span>＋</span> Generate Payroll
          </button>
        )}

      </div>

      {/* Error */}
      {error && (
        <div className="payroll-error">
          <span>{error}</span>

          <button onClick={fetchPayrolls}>
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}
      {!loading && !error && (
        <div className="payroll-stats-grid">

          <div className="payroll-stat-card">
            <div className="payroll-stat-icon blue">₹</div>
            <div>
              <span>Total Payroll Value</span>
              <h2>{formatCurrency(stats.totalPayroll)}</h2>
            </div>
          </div>

          <div className="payroll-stat-card">
            <div className="payroll-stat-icon green">✓</div>
            <div>
              <span>Paid Records</span>
              <h2>{stats.paid}</h2>
            </div>
          </div>

          <div className="payroll-stat-card">
            <div className="payroll-stat-icon orange">◷</div>
            <div>
              <span>Pending Records</span>
              <h2>{stats.pending}</h2>
            </div>
          </div>

          <div className="payroll-stat-card">
            <div className="payroll-stat-icon purple">▤</div>
            <div>
              <span>Total Records</span>
              <h2>{stats.total}</h2>
            </div>
          </div>

        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="payroll-message">
          <div className="payroll-spinner"></div>
          <p>Loading payroll records...</p>
        </div>
      )}

      {/* Payroll Table */}
      {!loading && !error && (
        <div className="payroll-card">

          <div className="payroll-toolbar">

            <div>
              <h3>Payroll Records</h3>
              <p>
                {filteredPayrolls.length} records found
              </p>
            </div>

            <div className="payroll-filters">

              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>

            </div>

          </div>

          {filteredPayrolls.length === 0 ? (

            <div className="payroll-empty">
              <div className="payroll-empty-icon">₹</div>

              <h3>No payroll records found</h3>

              <p>
                {payrolls.length === 0
                  ? "Payroll records will appear here once they are generated."
                  : "Try changing your search or status filter."}
              </p>
            </div>

          ) : (

            <div className="payroll-table-wrapper">

              <table className="payroll-table">

                <thead>
                  <tr>
                    {isAdmin && <th>Employee</th>}
                    <th>Payroll Period</th>
                    <th>Basic Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th>Payment Date</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>

                <tbody>

                  {filteredPayrolls.map((payroll) => (

                    <tr key={payroll.id}>

                      {isAdmin && (
                        <td>
                          <div className="payroll-employee">

                            <div className="payroll-avatar">
                              {payroll.employeeName
                                ?.charAt(0)
                                .toUpperCase() || "E"}
                            </div>

                            <div className="payroll-employee-name">
                              <strong>
                                {payroll.employeeName ||
                                  `Employee #${payroll.employeeId}`}
                              </strong>

                              <span>
                                {payroll.employeeCode ||
                                  `ID: ${payroll.employeeId}`}
                              </span>
                            </div>

                          </div>
                        </td>
                      )}

                      <td>
                        <span className="payroll-period">
                          {getPeriod(payroll.month, payroll.year)}
                        </span>
                      </td>

                      <td>
                        {formatCurrency(payroll.basicSalary)}
                      </td>

                      <td className="positive-value">
                        +{formatCurrency(payroll.allowances)}
                      </td>

                      <td className="negative-value">
                        -{formatCurrency(payroll.deductions)}
                      </td>

                      <td>
                        <strong className="net-salary">
                          {formatCurrency(payroll.netSalary)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`payroll-status ${getStatusClass(
                            payroll.status
                          )}`}
                        >
                          <span className="payroll-status-dot"></span>
                          {payroll.status}
                        </span>
                      </td>

                      <td>
                        {payroll.paymentDate
                          ? new Date(
                              payroll.paymentDate
                            ).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      {isAdmin && (
                        <td>
                          <div className="payroll-actions">

                            <button
                              className="payroll-edit-btn"
                              onClick={() => handleEdit(payroll)}
                              title="Edit payroll"
                            >
                              Edit
                            </button>

                            <button
                              className="payroll-delete-btn"
                              onClick={() => handleDelete(payroll.id)}
                              title="Delete payroll"
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
      )}

      {/* Create / Edit Modal */}
      {showModal && isAdmin && (

        <div
          className="payroll-modal-overlay"
          onClick={() => !saving && setShowModal(false)}
        >

          <div
            className="payroll-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="payroll-modal-header">

              <div>
                <h2>
                  {editingPayroll
                    ? "Edit Payroll"
                    : "Generate Payroll"}
                </h2>

                <p>
                  Enter salary information and payment details.
                </p>
              </div>

              <button
                className="payroll-modal-close"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="payroll-form-grid">

                {!editingPayroll && (
                  <div className="payroll-form-group full-width">

                    <label>Employee *</label>

                    <select
                      name="employeeId"
                      value={form.employeeId}
                      onChange={(e) => {
                        const selected = employees.find(
                          (emp) =>
                            emp.id === Number(e.target.value)
                        );

                        setForm((previous) => ({
                          ...previous,
                          employeeId: e.target.value,
                          basicSalary: selected?.salary ?? "",
                        }));
                      }}
                      required
                    >
                      <option value="">Select Employee</option>

                      {employees
                        .filter((emp) => emp.isActive !== false)
                        .map((employee) => (
                          <option
                            key={employee.id}
                            value={employee.id}
                          >
                            {employee.firstName} {employee.lastName}
                            {" — "}
                            {employee.employeeCode}
                          </option>
                        ))}
                    </select>

                  </div>
                )}

                {!editingPayroll && (
                  <>
                    <div className="payroll-form-group">
                      <label>Month *</label>

                      <select
                        name="month"
                        value={form.month}
                        onChange={handleChange}
                        required
                      >
                        {months.map((month, index) => (
                          <option key={month} value={index + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="payroll-form-group">
                      <label>Year *</label>

                      <input
                        type="number"
                        name="year"
                        min="2000"
                        max="2100"
                        value={form.year}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="payroll-form-group">
                  <label>Basic Salary (₹) *</label>

                  <input
                    type="number"
                    name="basicSalary"
                    min="0"
                    step="0.01"
                    value={form.basicSalary}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="payroll-form-group">
                  <label>Allowances (₹)</label>

                  <input
                    type="number"
                    name="allowances"
                    min="0"
                    step="0.01"
                    value={form.allowances}
                    onChange={handleChange}
                  />
                </div>

                <div className="payroll-form-group">
                  <label>Deductions (₹)</label>

                  <input
                    type="number"
                    name="deductions"
                    min="0"
                    step="0.01"
                    value={form.deductions}
                    onChange={handleChange}
                  />
                </div>

                <div className="payroll-form-group">
                  <label>Payment Status *</label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="payroll-form-group">
                  <label>Payment Date</label>

                  <input
                    type="date"
                    name="paymentDate"
                    value={form.paymentDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="payroll-form-group full-width">
                  <label>Remarks</label>

                  <textarea
                    name="remarks"
                    rows="3"
                    value={form.remarks}
                    onChange={handleChange}
                    placeholder="Enter additional remarks..."
                  />
                </div>

              </div>

              {/* Salary Calculation */}
              <div className="payroll-calculation">

                <div>
                  <span>Basic Salary</span>
                  <strong>{formatCurrency(form.basicSalary)}</strong>
                </div>

                <div>
                  <span>Allowances</span>
                  <strong className="positive-value">
                    +{formatCurrency(form.allowances)}
                  </strong>
                </div>

                <div>
                  <span>Deductions</span>
                  <strong className="negative-value">
                    -{formatCurrency(form.deductions)}
                  </strong>
                </div>

                <div className="payroll-calculation-total">
                  <span>Net Salary</span>
                  <strong>{formatCurrency(netSalary)}</strong>
                </div>

              </div>

              {formError && (
                <div className="payroll-form-error">
                  {formError}
                </div>
              )}

              <div className="payroll-modal-footer">

                <button
                  type="button"
                  className="payroll-secondary-btn"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="payroll-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingPayroll
                      ? "Save Changes"
                      : "Generate Payroll"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Payroll;