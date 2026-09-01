```markdown
# 📂 Archive App – Electronic Archiving System for the Commune

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/PWA-Supported-purple.svg" alt="PWA">
  <img src="https://img.shields.io/badge/License-Copyright%202026-green.svg" alt="License">
</p>

---

## 📌 Project Overview

**Archive App** (*Système d'Archivage Électronique pour la Commune*) is a secure, multi-user web platform designed specifically for municipal authorities. It transforms traditional paper-based archiving into a structured, digitised, and easily searchable electronic management system while enforcing strict role-based access control and document confidentiality.

Developed & Maintained by: **HASSANI FATIMA** © 2026.

---

## ✨ Key Features

- 🔒 **Authentication & Authorization (JWT & Bcrypt):** Multi-role access control (`Admin`, `Agent`, `User`).
- 📂 **Document Management (CRUD):** Upload, edit, view, and organize files (PDF, images, Word) by category and storage space.
- 🔖 **Automatic Reference Generator:** Assigns unique reference numbers to every document (e.g., `DOC-2026-000123`).
- 📦 **Bulk Export (ZIP):** Compress and download multiple selected files simultaneously using `Archiver`.
- 🔔 **Real-Time Notifications:** Live status alerts and activity pushes powered by `Socket.io`.
- 🌐 **Internationalization (i18n):** Native support for Arabic, French, and English.
- 📱 **Progressive Web App (PWA):** Offline-first capabilities and desktop/mobile installation support.
- 📜 **Audit Trail & Activity Logs:** Detailed operation tracking for administrators to monitor user actions and security events.
- 💾 **Automated Backups:** Integrated database backup routines to prevent data loss.
- 🎨 **Modern Glassmorphism UI:** Premium dark-mode palette, responsive layout, and interactive data charts powered by `Recharts`.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** React 18 + Vite 5
- **Routing:** React Router DOM
- **State & Real-Time:** Socket.io-client, React Context API
- **Data Visualization:** Recharts
- **Styling:** Custom CSS Variables (Glassmorphism Design Tokens)
- **Internationalization:** i18next & react-i18next

### **Backend**
- **Runtime:** Node.js 20 + Express.js
- **Database:** MySQL (`mysql2`)
- **Security:** Helmet, CORS, Express-Rate-Limit, JsonWebToken
- **File Processing:** Multer, Archiver
- **Validation:** Zod

---

## 📂 Repository Structure

```text
archive-app/
├── backend/
│   ├── config/          # Database connection settings
│   ├── controllers/     # Request handlers (Auth, Documents, Categories, Activity Logs...)
│   ├── middleware/      # JWT authentication, file upload (Multer), error handler
│   ├── models/          # Database query helpers
│   ├── routes/          # Express API endpoints
│   ├── uploads/         # Auto-created folder for document storage
│   ├── database.sql     # Database schema setup script
│   └── server.js        # Entry point for Express & Socket.io server
└── frontend/
    └── src/
        ├── api/         # Axios instance with automated JWT header injection
        ├── context/     # AuthContext and state providers
        ├── components/  # Sidebar, ProtectedRoute, NotificationsBell, LanguageSwitcher...
        ├── locales/     # i18n translation files (Ar, Fr, En)
        └── pages/       # Login, Dashboard, Documents, Users, ActivityLogs...

```

---

## 🚀 Getting Started

### **1. Prerequisites**

* Node.js (v18+)
* MySQL Server (XAMPP, WAMP, or standalone MySQL)

### **2. Database Setup**

Import the database schema using MySQL CLI or phpMyAdmin:

```bash
mysql -u root -p < backend/database.sql

```

This creates the `archive_jamaa` database, initializes the tables, loads default categories, and creates an administrator account:

* **Email:** `admin@jamaa.ma`
* **Password:** `Admin@1234`

*⚠️ Please change this password upon your first login.*

### **3. Backend Installation**

```bash
cd backend
npm install
cp .env.example .env

```

Edit your `.env` file to set your database credentials (`DB_USER`, `DB_PASSWORD`, `DB_PORT`) and specify a strong `JWT_SECRET`.

Start the backend server:

```bash
npm start

```

The server will run on `http://localhost:5000` (or `http://localhost:3000`).

### **4. Frontend Installation**

In a new terminal window:

```bash
cd frontend
npm install
npm run dev

```

Open your browser and navigate to `http://localhost:5173`.

---

## 💡 Future Roadmap

* [ ] **OCR Integration:** Extract searchable text from scanned PDFs/images using `Tesseract.js`.
* [ ] **Cloud Storage Sync:** Add support for S3/MinIO cloud object storage.
* [ ] **PDF Export Engine:** Generate downloadable PDF reports for document lists and audit logs.
* [ ] **Document Expiration Alerts:** Automatic warnings for legal contracts or document renewal dates.

---

## 📜 Intellectual Property & Copyright

All intellectual property rights, source code, architecture, and design concepts for this application belong exclusively to:

**HASSANI FATIMA** © 2026

*Système d'Archivage Électronique pour la Commune*

All rights reserved. Unauthorized copying, distribution, or modification of this project is strictly prohibited.

```

```
