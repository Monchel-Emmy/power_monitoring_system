## Power Monitoring Backend (Node/Express)

Development API server for the Power Monitoring System.

### Prerequisites

- Node.js 18+ installed

### Install dependencies

```bash
cd backend
npm install
```

### Run in development

```bash
npm run dev
```

Server will start on port `4000` by default.

### Available endpoints (initial)

- `GET /health` – simple health check.
- `GET /api/admin/overview` – summary metrics for the admin dashboard (static sample).
- `GET /api/buildings` – building list used by the Building Configuration page.
- `GET /api/audit-log` – audit log events used by the Audit Log page.

These responses currently use in-memory sample data that matches the frontend.
Later we can replace them with database calls and telemetry from hardware devices.

