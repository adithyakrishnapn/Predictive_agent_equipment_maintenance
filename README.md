# Predictive Agent - Hospital Equipment Maintenance Platform

A full-stack predictive maintenance platform for hospital imaging equipment (MRI/CT), built with:
- `frontend/`: React + Vite dashboard
- `backend/`: Node.js + Express API
- `ml_service/`: Python FastAPI ML inference service

The system predicts machine risk, enables monitoring start/stop, automates notifications, and provides reliability and cost analytics.

## Table Of Contents
1. Overview
2. Core Features
3. Architecture
4. Project Structure
5. Prerequisites
6. Environment Configuration
7. Run Locally
8. API Endpoints
9. Reliability Metrics
10. Data Storage
11. Troubleshooting
12. Current Implementation Notes

## Overview
This project is designed to help operations teams:
- monitor machine telemetry
- predict failures before breakdowns
- trigger automation workflows (vendor + engineering notifications)
- quantify uptime, downtime, MTBF, MTTR, availability, and cost impact

## Core Features
- Machine health and risk insights (Normal / Maintenance / Critical)
- Begin Processing workflow from UI
- Monitoring controls from frontend to ML service
- Vendor and engineering email automation
- Dashboard analytics and cost analysis
- Reliability metrics page with formulas and calculations
- JSON-based storage for backend records (no MongoDB required for current flow)

## Architecture
Frontend (React/Vite)
- Calls backend REST APIs (`/api/...`)
- Displays dashboard, machine details, reliability, appointments, cost analysis

Backend (Node/Express)
- Serves business APIs
- Calls ML service for predictions and telemetry-derived operations
- Handles automation and notification workflows
- Uses JSON files for data in current setup

ML Service (FastAPI)
- Predictive inference by machine ID
- Telemetry retrieval
- Monitoring state endpoints (`start`, `stop`, `status`)

## Project Structure
```text
Predictive_agent/
  backend/
    config/
    controllers/
    data/
      appointments.json
      machines.json
    middleware/
    models/
    routes/
    services/
    scripts/
    utils/
    server.js
    package.json
  frontend/
    public/
    src/
      components/
      config/
      pages/
      services/
      styles/
    package.json
  ml_service/
    app.py
    predictive_model.py
    telemetry_data.json
    training/
```

## Prerequisites
- Node.js 18+
- npm 9+
- Python 3.10+
- pip

## Environment Configuration

### Backend: `backend/.env`
Use `backend/.env.example` as base.

Required values:
```env
PORT=5000
NODE_ENV=development
ML_SERVICE_URL=http://127.0.0.1:8001
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-password
VENDOR_EMAIL=vendor@serviceprovider.com
ENGINEERING_TEAM_EMAIL=engineering@hospital.com
ADMIN_EMAIL=admin@hospital.com
CRITICAL_HEALTH_THRESHOLD=40
MAINTENANCE_HEALTH_THRESHOLD=75
LOG_LEVEL=info
```

### Frontend: `frontend/.env`
For Vite-based env access:
```env
VITE_API_URL=http://localhost:5000/api
```

Note: If you still have `REACT_APP_API_URL` from older setup, replace it with `VITE_API_URL`.

## Run Locally
Open separate terminals.

### 1) Start ML Service
From repository root (`d:\Projects\Predictive_agent`):
```powershell
python -m uvicorn ml_service.app:app --host 127.0.0.1 --port 8001
```

### 2) Start Backend
```powershell
cd backend
npm install
npm run dev
```

### 3) Start Frontend
```powershell
cd frontend
npm install
npm run dev
```

Vite usually starts at `http://localhost:5173` (or next free port, e.g. `5174`).

## API Endpoints

### Health
- `GET /health`

### Machines (`/api/machines`)
- `GET /` - all machines
- `GET /:machineId` - machine detail
- `GET /:machineId/telemetry` - telemetry
- `GET /:machineId/baseline` - baseline
- `POST /:machineId/detect-anomalies`
- `POST /classify-risk`
- `POST /:machineId/contact-vendor`
- `POST /:machineId/notify-engineering`
- `POST /:machineId/diagnostics`
- `POST /:machineId/monitoring/start`
- `POST /:machineId/monitoring/stop`
- `GET /:machineId/monitoring/status`

### Analytics (`/api/analytics`)
- `GET /dashboard`
- `GET /costs`
- `GET /insights`
- `GET /reliability`
- `GET /reliability/:machineId`

### Appointments (`/api/appointments`)
- `GET /`
- `GET /schedule/:machineId`
- `GET /affected`
- `POST /`
- `PUT /:appointmentId/reschedule`
- `PUT /:appointmentId/cancel`
- `POST /bulk-reschedule`

### Alerts (`/api/alerts`)
- `POST /`
- `GET /test-email`

### ML Service (direct)
- `GET /machines`
- `GET /machine/{machine_id}`
- `GET /telemetry/{machine_id}`
- `POST /monitoring/{machine_id}/start`
- `POST /monitoring/{machine_id}/stop`
- `GET /monitoring/{machine_id}/status`

## Reliability Metrics
The reliability module includes:
- Uptime (%)
- Downtime (%)
- MTBF (Mean Time Between Failures)
- MTTR (Mean Time To Repair)
- Maintenance Response Time
- Downtime Cost
- Availability
- Failure Rate

Analytics endpoints:
- Fleet summary: `GET /api/analytics/reliability?period=30`
- Machine detail: `GET /api/analytics/reliability/MRI_001?period=30`

## Data Storage
Current implementation uses JSON files for operational data in backend:
- `backend/data/machines.json`
- `backend/data/appointments.json`

ML telemetry source:
- `ml_service/telemetry_data.json`

## Troubleshooting

### 1) `process is not defined` in frontend
Cause: old React env pattern.
Fix: use `import.meta.env.VITE_API_URL` (already implemented in config).

### 2) Port already in use
Check and stop process:
```powershell
Get-NetTCPConnection -LocalPort 5000 -State Listen
Stop-Process -Id <PID> -Force
```

### 3) No data shown on Dashboard/Machine pages
The UI requires clicking `Begin Processing` first to trigger monitoring + automation + data load.

### 4) ML service cannot start on 8000
Use port `8001` and set backend env:
```env
ML_SERVICE_URL=http://127.0.0.1:8001
```

### 5) Email automation not sending
Verify backend `.env` has valid:
- `EMAIL_USER`
- `EMAIL_PASSWORD` (app password)
- recipient emails

## Current Implementation Notes
- Currency in Cost Analysis UI is shown in INR format.
- Processing state is preserved while switching pages in the app session.
- Full browser refresh resets in-memory UI state (expected behavior).
- Monitoring state in ML service is in-memory (resets when ML service restarts).
