# EduManage – Digital Learning & Administration Platform

> **EduManage** is a comprehensive educational ERP and Learning Management System designed to digitize administrative operations, streamline academic workflows, and facilitate real-time communication across educational institutions and Quranic associations.

---

## 📌 Project Overview
Built using a modern full stack architecture, **EduManage** provides a unified platform connecting administrators, teachers, students, and parents. It features a central **Web Portal** for administrative tasks and a cross platform **Mobile Application** for real time tracking, notifications.

### Key Capabilities
* **User & Role Management:** Granular access controls and registration workflows for Admins, Teachers, Students, and Parents.
* **Academic & Pedagogical Operations:** Course scheduling, learning session tracking, attendance monitoring, and automated certificate generation.
* **Financial Management & AI Analytics:** Hybrid payment integration (Stripe & In person), automated payment reminders, and AI driven financial reporting (powered by Gemini Flash).
* **Multi Channel Notifications:** Cross platform push and in app alerts to keep users updated on schedules, announcements, and payments.

---

## 🛠 Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express.js |
| **Frontend (Web)** | React.js, Tailwind CSS |
| **Mobile** | React Native / Expo |
| **Database** | MongoDB |
| **AI Integration** | Google Gemini API (gemini-flash-latest) |
| **Payments** | Stripe API |
| **Notifications** | Web Push API (VAPID Protocol) & Expo Push Notification Service |
    

---








# Backend Quick Start

## Prerequisites
- Node.js installed
- MongoDB running (local or Atlas)

## Start Backend Server

```bash
cd backend
npm run server
```

## Start Frontend

```bash
cd frontend
npm run dev
```

## Environment Variables

Update `backend/.env` if needed:
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Change in production
- `PORT`: Backend port (default: 5000)

## Test the Application

1. Go to http://localhost:3000/register
2. Create an account
3. Login at http://localhost:3000/login
4. Check MongoDB to verify user creation

## Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check MONGO_URI in .env

**Port Already in Use:**
- Change PORT in backend/.env
- Update proxy in frontend/vite.config.js

**CORS Issues:**
- Verify proxy is configured in vite.config.js
- Ensure backend has cors middleware
