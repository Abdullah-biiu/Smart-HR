# SmartHR – Human Resource Management System

A full-stack Human Resource Management System (HRMS) designed to simplify and streamline organizational HR operations. SmartHR provides centralized employee management, attendance tracking, leave management, and payroll administration through a secure and user-friendly platform.

## 🚀 Project Overview

SmartHR is a web-based HR management solution that helps organizations manage their workforce efficiently. It provides role-based access for administrators and employees, allowing HR operations to be handled digitally through an integrated platform.

The system is designed to reduce manual administrative work, improve data accuracy, and provide better visibility into employee-related information.

## ✨ Key Features

### 👨‍💼 Employee Management

* Add, update, view, and manage employee records.
* Maintain employee details, contact information, and joining dates.
* Assign departments and designations.
* Soft-delete employees through account deactivation.

### 🏢 Department & Designation Management

* Create and manage organizational departments.
* Define employee designations and job roles.
* Associate employees with their respective departments and designations.

### 🔐 Authentication & Authorization

* Secure user authentication.
* Role-based access control.
* Separate permissions for Administrators and Employees.
* Protected API endpoints.

### 📅 Attendance Management

* Record employee attendance.
* Track check-in and check-out times.
* Maintain daily attendance records.
* Allow employees to access their own attendance information.

### 📝 Leave Management

* Submit employee leave requests.
* Manage leave applications.
* Track leave request statuses.
* Provide administrative leave approval functionality.

### 💰 Payroll Management

* Manage employee salary information.
* Organize payroll records.
* Track salary components and deductions.
* Maintain payroll payment statuses.

## 🛠️ Technology Stack

| Category          | Technologies             |
| ----------------- | ------------------------ |
| Backend           | C#, ASP.NET Core Web API |
| Frontend          | React.js, JavaScript     |
| Database          | PostgreSQL               |
| ORM               | Entity Framework Core    |
| Database Provider | Npgsql                   |
| API Documentation | Swagger / OpenAPI        |
| Authentication    | JWT Authentication       |
| Version Control   | Git & GitHub             |

## 🏗️ System Architecture

SmartHR follows a client-server architecture:

```text
              SmartHR System
                    |
          +---------+---------+
          |                   |
      React.js           ASP.NET Core
      Frontend              Web API
                                |
                       Entity Framework Core
                                |
                           PostgreSQL
```

The React frontend communicates with the ASP.NET Core backend through RESTful APIs. Entity Framework Core manages database operations and interacts with PostgreSQL.

## 📂 Project Modules

| Module         | Description                       |
| -------------- | --------------------------------- |
| Authentication | Login and role-based access       |
| Employees      | Employee record management        |
| Departments    | Department administration         |
| Designations   | Job designation management        |
| Attendance     | Employee attendance tracking      |
| Leave          | Leave application and approval    |
| Payroll        | Salary and payroll administration |

## ⚙️ Installation & Setup

### Prerequisites

Make sure the following tools are installed:

* .NET SDK
* Node.js and npm
* PostgreSQL
* Git
* Visual Studio or Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/Abdullah-biiu/Smart-HR.git
```

Navigate to the project directory:

```bash
cd Smart-HR
```

### 2. Backend Setup

Navigate to the ASP.NET Core backend project directory:

```bash
cd SmartHR
```

Restore the required dependencies:

```bash
dotnet restore
```

### 3. Configure PostgreSQL

Update the connection string in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=SmartHR;Username=postgres;Password=YOUR_PASSWORD"
  }
}
```

Replace the database username and password with your PostgreSQL credentials.

### 4. Apply Database Migrations

```bash
dotnet ef database update
```

### 5. Run the Backend

```bash
dotnet run
```

Open Swagger to explore and test the available APIs:

```text
https://localhost:7104/swagger
```

*The URL may differ depending on your local launch settings.*

### 6. Frontend Setup

Navigate to the React frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at the local URL displayed in your terminal.

## 🔒 Security & Access Control

SmartHR implements role-based authorization to ensure that users can access only the resources permitted by their roles.

**Administrator**

* Manage employee records.
* Manage departments and designations.
* Access administrative attendance and leave operations.
* Perform authorized HR management activities.

**Employee**

* Access personal employee information.
* View personal attendance records.
* Submit leave requests.
* Access permitted personal HR information.

## 🎯 Business Benefits

* **Improved Efficiency:** Automates routine HR operations and reduces manual paperwork.
* **Centralized Management:** Keeps employee information organized in one system.
* **Better Accuracy:** Reduces errors associated with manual record keeping.
* **Transparency:** Provides employees with access to their relevant HR information.
* **Scalability:** Provides a foundation for expanding organizational HR functionality.

## 🔮 Future Enhancements

* Automated payroll processing.
* Salary slip generation and PDF downloads.
* Advanced attendance reports.
* Email notifications for leave approvals.
* Interactive HR analytics dashboard.
* Employee performance management.
* Cloud deployment and production optimization.

## 👨‍💻 Developer

**Abdullah Ahmad**

Full-Stack Web Developer

GitHub: [Abdullah-biiu](https://github.com/Abdullah-biiu)

Project Repository: [Smart-HR](https://github.com/Abdullah-biiu/Smart-HR)

---

⭐ If you find this project useful, consider giving it a star!
