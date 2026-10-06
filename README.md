# Classroom Scheduling and Booking System

A full-stack web application for academic resource management, facilitating classroom scheduling and ad-hoc room reservations. Built with a React frontend, Node.js/Express backend, and PostgreSQL database via Supabase.

---

## Table of Contents
- [Architecture](#architecture)
- [System Features](#system-features)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [License](#license)

---

## English Documentation

### Architecture
- **Frontend**: React 19 (CRA), Axios for HTTP client operations.
- **Backend**: Node.js, Express 5.
- **Database & Authentication**: Supabase (PostgreSQL), utilizing the custom `users` table for Role-Based Access Control (RBAC).

### System Features
- **Role-Based Access Control (RBAC)**:
  - `admin`: Full system access, including scenario management, global schedule overrides, and booking cancellation.
  - `lecturer`: Authorized to perform ad-hoc room bookings and query personal booking history.
  - `student`: Read-only access to room availability and scheduling matrices.
- **Conflict Resolution Engine**: Evaluates time slot and room combinations to prevent double-booking against both recurring schedules and ad-hoc reservations.
- **Scenario Management**: Enables context switching (e.g., active academic semester). Switching active scenarios automatically purges or invalidates active bookings tied to previous states.

---

## Dokumentasi Bahasa Indonesia

### Arsitektur
- **Frontend**: React 19 (CRA), Axios untuk operasi HTTP client.
- **Backend**: Node.js, Express 5.
- **Basis Data & Autentikasi**: Supabase (PostgreSQL), menggunakan tabel `users` khusus untuk Role-Based Access Control (RBAC).

### Fitur Sistem
- **Role-Based Access Control (RBAC)**:
  - `admin`: Akses sistem penuh, termasuk manajemen skenario, modifikasi jadwal global, dan pembatalan reservasi.
  - `lecturer`: Memiliki otorisasi untuk melakukan reservasi ruangan ad-hoc dan melihat riwayat reservasi pribadi.
  - `student`: Akses read-only terhadap ketersediaan ruangan dan matriks penjadwalan.
- **Mesin Resolusi Konflik**: Mengevaluasi kombinasi slot waktu dan ruangan untuk mencegah pemesanan ganda (double-booking) terhadap jadwal rutin maupun reservasi ad-hoc.
- **Manajemen Skenario**: Memungkinkan pergantian konteks (misal: pergantian semester akademik). Mengganti skenario aktif secara otomatis membatalkan atau mengabaikan reservasi aktif yang terikat pada status sebelumnya.

---

## Project Structure

```text
projek penjadwalan dan booking kelas/
├── classroom-scheduling-backend/
│   ├── server.js               # Express application entry point and route definitions
│   ├── .env                    # Environment configuration (excluded from VCS)
│   ├── .env.example            # Environment configuration template
│   └── package.json            # Node.js dependencies and scripts
└── classroom-scheduling-frontend/
    ├── src/
    │   ├── components/         # React presentation and container components
    │   ├── services/           # API integration layer (Axios instances)
    │   └── App.js              # Root component with routing and auth state
    ├── .env                    # Frontend environment variables
    ├── .env.example            # Frontend environment variable template
    └── package.json            # Frontend dependencies and scripts
```

## Setup and Installation

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)
- Supabase Project

### Installation Steps

1. Clone the repository and navigate to the project root.
2. Initialize the backend environment:
   ```bash
   cd classroom-scheduling-backend
   npm install
   ```
3. Initialize the frontend environment:
   ```bash
   cd ../classroom-scheduling-frontend
   npm install
   ```

## Environment Variables

Copy the provided `.env.example` to `.env` in both backend and frontend directories and populate the values.

### Backend (`classroom-scheduling-backend/.env`)
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase instance URL. |
| `SUPABASE_ANON_KEY` | Public access token for Supabase. |
| `SUPABASE_SECRET_KEY` | Service role key for backend operations (bypasses RLS). |
| `PORT` | Express server binding port (Default: 3001). |
| `ALLOWED_ORIGIN` | CORS allowed origin for frontend requests (Default: `http://localhost:3000`). |

### Frontend (`classroom-scheduling-frontend/.env`)
| Variable | Description |
|---|---|
| `REACT_APP_SUPABASE_URL` | Supabase instance URL. |
| `REACT_APP_SUPABASE_ANON_KEY` | Public access token for Supabase. |
| `REACT_APP_API_URL` | Backend Express API endpoint (Default: `http://localhost:3001`). |

## API Reference

Base URL: `http://localhost:3001` (Default)

| HTTP Method | Endpoint | Description |
|---|---|---|
| `GET` | `/test` | Service health check. |
| `GET` | `/rooms` | Retrieves all registered rooms. |
| `GET` | `/rooms/:roomId/availability` | Evaluates room availability given `jam_ke` and `date` query parameters. |
| `POST` | `/bookings` | Initializes a new room reservation. |
| `GET` | `/my-bookings/:lecturerId` | Retrieves reservation history for a specific lecturer ID. |
| `GET` | `/all-bookings` | Retrieves all active reservations (Admin). |
| `PUT` | `/bookings/:bookingId/cancel` | Updates booking status to canceled. |
| `POST` | `/class-schedules` | Inserts a recurring class schedule instance. |
| `GET` | `/class-schedules` | Retrieves all class schedules. |
| `DELETE` | `/class-schedules/:scheduleId` | Removes a class schedule instance. |
| `GET` | `/scenarios` | Retrieves system scenarios. |
| `POST` | `/scenarios/:scenarioId/activate` | Updates active scenario state and invalidates existing reservations. |

## Database Schema

Database engine: PostgreSQL (via Supabase)

| Table | Primary Key | Notable Columns | Description |
|---|---|---|---|
| `users` | `id` (UUID) | `name`, `role` | Identity and RBAC definition (`admin`, `lecturer`, `student`). |
| `rooms` | `id` (UUID) | `name`, `capacity` | Physical resource definitions. |
| `scenarios` | `id` (UUID) | `name`, `is_active` (Boolean) | Academic period state tracking. |
| `bookings` | `id` (UUID) | `lecturer_id`, `room_id`, `date`, `jam_ke`, `status`, `scenario_id` | Ad-hoc reservation records. |
| `class_schedules` | `id` (UUID) | `room_id`, `jam_ke`, `day_of_week`, `scenario_id` | Recurring timetable definitions. |

**Data Types & Constraints:**
- `day_of_week`: Integer representation (1 = Monday, ..., 6 = Saturday).
- `jam_ke`: Integer representation of the discrete daily time slot.

## License

ISC License.
