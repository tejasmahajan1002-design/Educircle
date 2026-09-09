# CampusShare - Student Resource & Mutual Sharing Platform

A full-stack, secure, authenticated peer-to-peer web platform for college students to rent, barter, exchange, or donate academic items, complete with automated ZPRN roster verification and real-time Gmail SMTP verification codes.

---

## 🚀 Quick Access Links

* **Open Web Application Directly (Browser)**:  
  👉 [`file:///D:/PROJECT%201/index.html`](file:///D:/PROJECT%201/index.html)  
  *(Alternatively, double-click `open_website.bat` in this folder)*

* **Frontend Directory Location**:  
  👉 [`file:///D:/PROJECT%201/frontend/index.html`](file:///D:/PROJECT%201/frontend/index.html)

* **Backend Real-Time API Server**:  
  👉 `http://localhost:5000` (Start via `start_backend.bat`)

* **GitHub Repository**:  
  👉 [https://github.com/tejasmahajan1002-design/Educircle](https://github.com/tejasmahajan1002-design/Educircle)

---

## 📁 Organized Project Structure

```
D:\PROJECT 1\
├── frontend\                      # Frontend UI & Web Application
│   ├── index.html                 # Primary CampusShare Single-Page Web App
│   ├── campushare_app.html        # Backup Standalone Web App
│   ├── src\                       # React Components & Source Files
│   ├── package.json               # Frontend dependencies
│   └── vite.config.js             # Vite configuration
│
├── backend\                       # Node.js Express API Server
│   ├── server.js                  # Main server entry point (Port 5000)
│   ├── routes\                    # Express REST API routes (api.js)
│   ├── services\                  # Email (Nodemailer) & ECE Student Directory
│   ├── models\                    # JSON database access logic (db.js)
│   ├── middleware\                # JWT & Role authorization middleware
│   ├── data\                      # Local database collections (JSON files)
│   │   ├── users.json             # User accounts & profiles
│   │   ├── resources.json         # Listed academic items
│   │   ├── transactions.json      # Borrow & exchange logs
│   │   └── ...
│   ├── package.json               # Backend dependencies
│   └── .env                       # SMTP & Server configurations
│
├── database\                      # Database Schemas & Setup
│   └── schema.sql                 # MySQL relational database schema
│
├── docs\                          # Documentation & Academic Reports
│   ├── project_synopsis.pdf       # Compiled Project Synopsis PDF
│   ├── project_synopsis.md        # Synopsis Markdown source
│   └── project_synopsis.html      # Print-ready HTML document
│
├── php_backend\                   # Optional PHP/Apache fallback endpoints
│   ├── db.php, config.php, register.php, login.php, setup.php
│
├── index.html                     # Root entry point (openable directly anywhere)
├── open_website.bat               # One-click website browser launcher
├── start_backend.bat              # One-click backend server launcher
└── README.md                      # Project documentation and links
```

---

## 🔑 Login & Registration Details

### 1. Student Registration (Automatic Detection)
* Students register using **only their ZPRN Number** and a **Password**.
* The system automatically cross-references the official ECE student directory to identify the student's **Name** and **College Gmail Address**.
* A 6-digit verification code is generated and dispatched via Gmail SMTP to that registered email address.
* *Example Test ZPRN*: `125UEC1077` (Auto-detected: Tejas Kishorkumar Mahajan, Email: `tejasmahajan1002@gmail.com`)

### 2. Administrator Login
* **Admin Email**: `admin@campushare.edu`
* **Password**: `admin123`
* **Access**: Administrative moderation, user management, and item listings.

---

## 🛠️ How to Run

1. **Launch Website**: Double-click `open_website.bat` or open `index.html` in any browser (Chrome, Edge, etc.).
2. **Launch Node.js Backend Server** (Optional for live real-time Gmail delivery): Double-click `start_backend.bat`.
3. If the backend is not started, the application automatically uses local simulation fallback mode so all features remain testable offline.
