
import { useEffect, useState } from "react";
import api from "../api";
import "./Employees.css";

function Employees() {
  // ================================
  // Current User
  // ================================

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const isAdmin = user?.role === "Admin";

  // ================================
  // Employees
  // ================================

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ================================
  // Departments
  // ================================

  const [departments, setDepartments] =
    useState([]);

  // ================================
  // Designations
  // ================================

  const [designations, setDesignations] =
    useState([]);

  // ================================
  // Add Employee Form
  // ================================

  const [showForm, setShowForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // ================================
  // Employee Details
  // ================================

  const [selectedEmployee, setSelectedEmployee] =
    useState(null);

  // ================================
  // Edit Employee
  // ================================

  const [editingEmployee, setEditingEmployee] =
    useState(null);

  // ================================
  // Deactivate Employee
  // ================================

  const [deactivating, setDeactivating] =
    useState(false);

  // ================================
  // Form Data
  // ================================

  const [formData, setFormData] =
    useState({
      employeeCode: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      departmentName: "",
      designationName: "",
      dateOfJoining: "",
      salary: ""
    });

  // ================================
  // Load Employees
  // ================================

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/Employees");

      setEmployees(response.data);
    } catch (error) {
      console.error(
        "Failed to load employees:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load employees."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // Load Departments
  // ================================

  const fetchDepartments = async () => {
    try {
      const response =
        await api.get("/Departments");

      setDepartments(response.data);
    } catch (error) {
      console.error(
        "Failed to load departments:",
        error
      );
    }
  };

  // ================================
  // Load Designations
  // ================================

  const fetchDesignations = async () => {
    try {
      const response =
        await api.get("/Designations");

      setDesignations(response.data);
    } catch (error) {
      console.error(
        "Failed to load designations:",
        error
      );
    }
  };

  // ================================
  // Initial Load
  // ================================

  useEffect(() => {
    fetchEmployees();

    if (isAdmin) {
      fetchDepartments();
      fetchDesignations();
    }
  }, [isAdmin]);

  // ================================
  // Handle Form Input
  // ================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));

    setFormError("");
    setSuccessMessage("");
  };

  // ================================
  // Open Add Employee Form
  // ================================

  const handleOpenForm = () => {
    setFormError("");
    setSuccessMessage("");

    setFormData({
      employeeCode: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      departmentName: "",
      designationName: "",
      dateOfJoining: "",
      salary: ""
    });

    setShowForm(true);
  };

  // ================================
  // Close Add Employee Form
  // ================================

  const handleCloseForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setFormError("");
  };

  // ================================
  // Employee Details
  // ================================

  const handleOpenDetails = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleCloseDetails = () => {
    setSelectedEmployee(null);
  };

  // ================================
  // Open Edit Employee Form
  // ================================

  const handleOpenEdit = (employee) => {
    if (!isAdmin) {
      return;
    }

    setFormError("");
    setSuccessMessage("");

    setFormData({
      employeeCode: employee.employeeCode || "",
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      phone: employee.phone || "",
      departmentName: employee.department?.name || "",
      designationName: employee.designation?.name || "",
      dateOfJoining: employee.dateOfJoining || "",
      salary: employee.salary ?? ""
    });

    setEditingEmployee(employee);
    setSelectedEmployee(null);
    setShowForm(true);
  };

  // ================================
  // Close Edit Employee Form
  // ================================

  const handleCloseEdit = () => {
    if (saving) {
      return;
    }

    setEditingEmployee(null);
    setShowForm(false);
    setFormError("");
  };

  // ================================
  // Update Employee
  // ================================

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();

    if (!editingEmployee) return;

    setFormError("");
    setSuccessMessage("");

    if (
      !formData.employeeCode.trim() ||
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.departmentName.trim() ||
      !formData.designationName.trim() ||
      !formData.dateOfJoining ||
      formData.salary === ""
    ) {
      setFormError(
        "Please fill in all required fields."
      );
      return;
    }

    const salary = Number(formData.salary);

    if (Number.isNaN(salary) || salary < 0) {
      setFormError(
        "Please enter a valid salary."
      );
      return;
    }

    try {
      setSaving(true);

      await api.put(
        `/Employees/${editingEmployee.id}`,
        {
          employeeCode:
            formData.employeeCode.trim(),

          firstName:
            formData.firstName.trim(),

          lastName:
            formData.lastName.trim(),

          email:
            formData.email.trim(),

          phone:
            formData.phone.trim(),

          departmentName:
            formData.departmentName.trim(),

          designationName:
            formData.designationName.trim(),

          dateOfJoining:
            formData.dateOfJoining,

          salary: salary,

          isActive:
            editingEmployee.isActive ?? true
        }
      );

      setSuccessMessage(
        "Employee updated successfully."
      );

      setEditingEmployee(null);
      setShowForm(false);

      setFormData({
        employeeCode: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        departmentName: "",
        designationName: "",
        dateOfJoining: "",
        salary: ""
      });

      await fetchEmployees();
      await fetchDepartments();
      await fetchDesignations();

    } catch (error) {
      console.error(
        "Update employee error:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to update employee.";

      setFormError(message);

    } finally {
      setSaving(false);
    }
  };

  // ================================
  // Deactivate Employee
  // ================================

  const handleDeactivateEmployee = async () => {
    if (!selectedEmployee) {
      return;
    }

    if (!isAdmin) {
      return;
    }

    if (!selectedEmployee.isActive) {
      setSuccessMessage(
        "Employee is already inactive."
      );
      return;
    }

    const employeeName =
      `${selectedEmployee.firstName || ""} ${
        selectedEmployee.lastName || ""
      }`.trim();

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${employeeName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeactivating(true);

      setError("");
      setSuccessMessage("");

      await api.delete(
        `/Employees/${selectedEmployee.id}`
      );

      setSuccessMessage(
        "Employee deactivated successfully."
      );

      setSelectedEmployee(null);

      await fetchEmployees();

    } catch (error) {
      console.error(
        "Deactivate employee error:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to deactivate employee.";

      setError(message);

    } finally {
      setDeactivating(false);
    }
  };

  // ================================
  // Create Employee
  // ================================

  const handleCreateEmployee = async (e) => {
    e.preventDefault();

    setFormError("");
    setSuccessMessage("");

    // ================================
    // Required Field Validation
    // ================================

    if (
      !formData.employeeCode.trim() ||
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.departmentName.trim() ||
      !formData.designationName.trim() ||
      !formData.dateOfJoining ||
      !formData.salary
    ) {
      setFormError(
        "Please fill in all required fields."
      );

      return;
    }

    // ================================
    // Salary Validation
    // ================================

    const salary =
      Number(formData.salary);

    if (
      Number.isNaN(salary) ||
      salary < 0
    ) {
      setFormError(
        "Please enter a valid salary."
      );

      return;
    }

    try {
      setSaving(true);

      // ================================
      // Send Employee
      // ================================

      await api.post("/Employees", {
        employeeCode:
          formData.employeeCode.trim(),

        firstName:
          formData.firstName.trim(),

        lastName:
          formData.lastName.trim(),

        email:
          formData.email.trim(),

        phone:
          formData.phone.trim(),

        departmentName:
          formData.departmentName.trim(),

        designationName:
          formData.designationName.trim(),

        dateOfJoining:
          formData.dateOfJoining,

        salary: salary
      });

      // ================================
      // Success
      // ================================

      setSuccessMessage(
        "Employee created successfully."
      );

      // ================================
      // Close Form
      // ================================

      setShowForm(false);

      // ================================
      // Reset Form
      // ================================

      setFormData({
        employeeCode: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        departmentName: "",
        designationName: "",
        dateOfJoining: "",
        salary: ""
      });

      // ================================
      // Refresh Data
      // ================================

      await fetchEmployees();
      await fetchDepartments();
      await fetchDesignations();

    } catch (error) {
      console.error(
        "Failed to create employee:",
        error
      );

      const responseData =
        error.response?.data;

      // ================================
      // ASP.NET Validation Errors
      // ================================

      if (responseData?.errors) {
        const validationErrors =
          Object.values(
            responseData.errors
          )
            .flat()
            .join(" ");

        setFormError(
          validationErrors ||
            "Please correct the form errors."
        );
      } else {
        setFormError(
          responseData?.message ||
            "Failed to create employee."
        );
      }

    } finally {
      setSaving(false);
    }
  };

  // ================================
  // Search Employees
  // ================================

  const filteredEmployees =
    employees.filter((employee) => {

      const searchText =
        search.toLowerCase().trim();

      if (!searchText) {
        return true;
      }

      const fullName =
        `${employee.firstName || ""} ${
          employee.lastName || ""
        }`.toLowerCase();

      const employeeCode =
        employee.employeeCode
          ?.toLowerCase() || "";

      const email =
        employee.email?.toLowerCase() ||
        "";

      const phone =
        employee.phone?.toLowerCase() ||
        "";

      const department =
        employee.department?.name
          ?.toLowerCase() || "";

      const designation =
        employee.designation?.name
          ?.toLowerCase() || "";

      return (
        fullName.includes(searchText) ||
        employeeCode.includes(searchText) ||
        email.includes(searchText) ||
        phone.includes(searchText) ||
        department.includes(searchText) ||
        designation.includes(searchText)
      );
    });

  // ================================
  // Render
  // ================================

  return (
    <div className="employees-page">

      {/* ================================
          Header
      ================================= */}

      <div className="employees-header">

        <div>

          <h1>
            Employees
          </h1>

          <p>
            Manage and view SmartHR employees.
          </p>

        </div>

        <div className="employee-header-actions">

          <div className="employee-count">

            Total Employees:{" "}

            <strong>
              {employees.length}
            </strong>

          </div>

          {isAdmin && (
            <button
              type="button"
              className="add-employee-button"
              onClick={handleOpenForm}
            >
              <span>+</span>
              Add Employee
            </button>
          )}

        </div>

      </div>

      {/* ================================
          Success Message
      ================================= */}

      {successMessage && (
        <div className="employee-success">
          {successMessage}
        </div>
      )}

      {/* ================================
          Error Message
      ================================= */}

      {error && (
        <div className="employee-error">
          {error}
        </div>
      )}

      {/* ================================
          Add/Edit Employee Form
      ================================= */}

      {showForm && isAdmin && (

        <div className="employee-form-card">

          {/* Form Header */}

          <div className="employee-form-header">

            <div>

              <h2>
                {editingEmployee
                  ? "Edit Employee"
                  : "Add New Employee"}
              </h2>

              <p>
                {editingEmployee
                  ? "Update the employee details below."
                  : "Enter the employee details below."}
              </p>

            </div>

            <button
              type="button"
              className="close-form-button"
              onClick={
                editingEmployee
                  ? handleCloseEdit
                  : handleCloseForm
              }
              disabled={saving}
            >
              ×
            </button>

          </div>

          {/* Form Error */}

          {formError && (
            <div className="employee-form-error">
              {formError}
            </div>
          )}

          {/* Form */}

          <form
            onSubmit={
              editingEmployee
                ? handleUpdateEmployee
                : handleCreateEmployee
            }
          >

            <div className="employee-form-grid">

              {/* Employee Code */}

              <div className="form-group">

                <label>
                  Employee Code
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="employeeCode"
                  value={
                    formData.employeeCode
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="e.g. EMP004"
                  required
                />

              </div>

              {/* First Name */}

              <div className="form-group">

                <label>
                  First Name
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="firstName"
                  value={
                    formData.firstName
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter first name"
                  required
                />

              </div>

              {/* Last Name */}

              <div className="form-group">

                <label>
                  Last Name
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="lastName"
                  value={
                    formData.lastName
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter last name"
                  required
                />

              </div>

              {/* Email */}

              <div className="form-group">

                <label>
                  Email
                  <span>*</span>
                </label>

                <input
                  type="email"
                  name="email"
                  value={
                    formData.email
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="employee@example.com"
                  required
                />

              </div>

              {/* Phone */}

              <div className="form-group">

                <label>
                  Phone
                  <span>*</span>
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={
                    formData.phone
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter phone number"
                  required
                />

              </div>

              {/* Department */}

              <div className="form-group">

                <label>
                  Department
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="departmentName"
                  value={
                    formData.departmentName
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="e.g. IT"
                  list="department-options"
                  autoComplete="off"
                  required
                />

                <datalist
                  id="department-options"
                >

                  {departments
                    .filter(
                      (department) =>
                        department.isActive
                    )
                    .map(
                      (department) => (
                        <option
                          key={
                            department.id
                          }
                          value={
                            department.name
                          }
                        />
                      )
                    )}

                </datalist>

              </div>

              {/* Designation */}

              <div className="form-group">

                <label>
                  Designation
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="designationName"
                  value={
                    formData.designationName
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="e.g. Software Developer"
                  list="designation-options"
                  autoComplete="off"
                  required
                />

                <datalist
                  id="designation-options"
                >

                  {designations
                    .filter(
                      (designation) =>
                        designation.isActive
                    )
                    .map(
                      (designation) => (
                        <option
                          key={
                            designation.id
                          }
                          value={
                            designation.name
                          }
                        />
                      )
                    )}

                </datalist>

              </div>

              {/* Date Of Joining */}

              <div className="form-group">

                <label>
                  Date of Joining
                  <span>*</span>
                </label>

                <input
                  type="date"
                  name="dateOfJoining"
                  value={
                    formData.dateOfJoining
                  }
                  onChange={
                    handleInputChange
                  }
                  required
                />

              </div>

              {/* Salary */}

              <div className="form-group">

                <label>
                  Salary
                  <span>*</span>
                </label>

                <input
                  type="number"
                  name="salary"
                  value={
                    formData.salary
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter salary"
                  min="0"
                  step="0.01"
                  required
                />

              </div>

            </div>

            {/* Form Actions */}

            <div className="employee-form-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={
                  editingEmployee
                    ? handleCloseEdit
                    : handleCloseForm
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-employee-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingEmployee
                    ? "Update Employee"
                    : "Save Employee"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ================================
          Search
      ================================= */}

      <div className="employee-toolbar">

        <div className="search-box">

          <span className="search-icon">
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search employees..."
          />

          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={() =>
                setSearch("")
              }
            >
              ×
            </button>
          )}

        </div>

        <div className="search-result-count">

          Showing{" "}

          <strong>
            {filteredEmployees.length}
          </strong>{" "}

          of{" "}

          <strong>
            {employees.length}
          </strong>

        </div>

      </div>

      {/* ================================
          Loading
      ================================= */}

      {loading && (
        <div className="employee-message">
          Loading employees...
        </div>
      )}

      {/* ================================
          Error
      ================================= */}

      {!loading && error && (
        <div className="employee-error">
          {error}
        </div>
      )}

      {/* ================================
          No Employees
      ================================= */}

      {!loading &&
        !error &&
        employees.length === 0 && (
          <div className="employee-message">
            No employees found.
          </div>
        )}

      {/* ================================
          No Search Results
      ================================= */}

      {!loading &&
        !error &&
        employees.length > 0 &&
        filteredEmployees.length === 0 && (
          <div className="employee-message">
            No employees match your search.
          </div>
        )}

      {/* ================================
          Employee Table
      ================================= */}

      {!loading &&
        !error &&
        filteredEmployees.length > 0 && (

          <div className="employees-table-container">

            <table className="employees-table">

              <thead>

                <tr>
                  <th>Code</th>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                {filteredEmployees.map(
                  (employee) => (

                    <tr
                      key={employee.id}
                      className="employee-row"
                      onClick={() =>
                        handleOpenDetails(
                          employee
                        )
                      }
                    >

                      {/* Code */}

                      <td>

                        <span className="employee-code">
                          {
                            employee.employeeCode
                          }
                        </span>

                      </td>

                      {/* Employee */}

                      <td>

                        <div className="employee-name">

                          <div className="employee-avatar">

                            {employee.firstName
                              ?.charAt(0)
                              .toUpperCase()}

                          </div>

                          <div>

                            <strong>

                              {
                                employee.firstName
                              }{" "}

                              {
                                employee.lastName
                              }

                            </strong>

                            <span>

                              Employee ID:{" "}

                              {employee.id}

                            </span>

                          </div>

                        </div>

                      </td>

                      {/* Email */}

                      <td>
                        {
                          employee.email ||
                          "-"
                        }
                      </td>

                      {/* Phone */}

                      <td>
                        {
                          employee.phone ||
                          "-"
                        }
                      </td>

                      {/* Department */}

                      <td>
                        {
                          employee.department
                            ?.name || "-"
                        }
                      </td>

                      {/* Designation */}

                      <td>
                        {
                          employee.designation
                            ?.name || "-"
                        }
                      </td>

                      {/* Salary */}

                      <td>

                        ₹
                        {Number(
                          employee.salary ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}

                      </td>

                      {/* Status */}

                      <td>

                        <span
                          className={`employee-status ${
                            employee.isActive
                              ? "active"
                              : "inactive"
                          }`}
                        >

                          {
                            employee.isActive
                              ? "Active"
                              : "Inactive"
                          }

                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      {/* ================================
          Employee Details Modal
      ================================= */}

      {selectedEmployee && (

        <div
          className="employee-details-overlay"
          onClick={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              handleCloseDetails();
            }
          }}
        >

          <div className="employee-details-card">

            {/* Details Header */}

            <div className="employee-details-header">

              <div>

                <h2>
                  Employee Details
                </h2>

                <p>
                  View complete employee
                  information.
                </p>

              </div>

              <button
                type="button"
                className="employee-details-close"
                onClick={
                  handleCloseDetails
                }
              >
                ×
              </button>

            </div>

            {/* Employee Profile */}

            <div className="employee-details-profile">

              <div className="employee-details-avatar">

                {selectedEmployee.firstName
                  ?.charAt(0)
                  .toUpperCase()}

              </div>

              <div>

                <h3>

                  {
                    selectedEmployee.firstName
                  }{" "}

                  {
                    selectedEmployee.lastName
                  }

                </h3>

                <span>
                  {
                    selectedEmployee.employeeCode
                  }
                </span>

              </div>

            </div>

            {/* Employee Information */}

            <div className="employee-details-grid">

              <div className="employee-detail-item">
                <span>
                  Employee ID
                </span>

                <strong>
                  {selectedEmployee.id}
                </strong>
              </div>

              <div className="employee-detail-item">
                <span>
                  Employee Code
                </span>

                <strong>
                  {
                    selectedEmployee.employeeCode ||
                    "-"
                  }
                </strong>
              </div>

              <div className="employee-detail-item">
                <span>
                  First Name
                </span>

                <strong>
                  {
                    selectedEmployee.firstName ||
                    "-"
                  }
                </strong>
              </div>

              <div className="employee-detail-item">
                <span>
                  Last Name
                </span>

                <strong>
                  {
                    selectedEmployee.lastName ||
                    "-"
                  }
                </strong>
              </div>

              <div className="employee-detail-item">
                <span>
                  Email
                </span>

                <strong>
                  {
                    selectedEmployee.email ||
                    "-"
                  }
                </strong>
              </div>

              <div className="employee-detail-item">
                <span>
                  Phone
                </span>

                <strong>
                  {
                    selectedEmployee.phone ||
                    "-"
                  }
                </strong>
              </div>

              <div className="employee-detail-item">
                <span>
                  Department
                </span>

                <strong>
                  {
                    selectedEmployee.department
                      ?.name || "-"
                  }
                </strong>
              </div>

              <div className="employee-detail-item">
                <span>
                  Designation
                </span>

                <strong>
                  {
                    selectedEmployee.designation
                      ?.name || "-"
                  }
                </strong>
              </div>

              <div className="employee-detail-item">
                <span>
                  Date of Joining
                </span>

                <strong>
                  {
                    selectedEmployee.dateOfJoining ||
                    "-"
                  }
                </strong>
              </div>

              <div className="employee-detail-item">
                <span>
                  Salary
                </span>

                <strong>
                  ₹
                  {Number(
                    selectedEmployee.salary ||
                      0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div className="employee-detail-item">
                <span>
                  Status
                </span>

                <strong>

                  <span
                    className={`employee-status ${
                      selectedEmployee.isActive
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {
                      selectedEmployee.isActive
                        ? "Active"
                        : "Inactive"
                    }
                  </span>

                </strong>

              </div>

            </div>

            {/* Employee Actions */}

            <div className="employee-details-actions">

              {isAdmin && (
                <button
                  type="button"
                  className="employee-edit-button"
                  onClick={() =>
                    handleOpenEdit(
                      selectedEmployee
                    )
                  }
                  disabled={deactivating}
                >
                  Edit Employee
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  className="employee-deactivate-button"
                  onClick={
                    handleDeactivateEmployee
                  }
                  disabled={
                    deactivating ||
                    !selectedEmployee.isActive
                  }
                >
                  {deactivating
                    ? "Deactivating..."
                    : selectedEmployee.isActive
                      ? "Deactivate Employee"
                      : "Already Inactive"}
                </button>
              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Employees;

