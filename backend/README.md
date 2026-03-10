# Hospital Predictive Maintenance Backend

Node.js backend for the Hospital Predictive Equipment Maintenance System. This backend integrates with a Python ML service to provide predictive maintenance capabilities for MRI and CT scan machines.

## Features

- **Machine Management**: Track and monitor hospital equipment
- **ML Integration**: Real-time predictions from Python ML service
- **Vendor Management**: Manage service vendors and maintenance scheduling
- **Appointment System**: Handle patient appointments and reschedules
- **Alert System**: Real-time alerts for equipment issues
- **Analytics & Reporting**: Cost analysis, utilization reports, and predictive insights
- **User Management**: Authentication and role-based access control

## Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Logging**: Winston
- **Security**: Helmet, CORS
- **ML Integration**: Axios (connecting to Python FastAPI service)

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/             # Request handlers
│   ├── alertController.js
│   ├── analyticsController.js
│   ├── appointmentController.js
│   ├── machineController.js
│   ├── userController.js
│   └── vendorController.js
├── models/                  # Mongoose schemas
│   ├── Alert.js
│   ├── Appointment.js
│   ├── Machine.js
│   ├── User.js
│   └── Vendor.js
├── routes/                  # API routes
│   ├── alertRoutes.js
│   ├── analyticsRoutes.js
│   ├── appointmentRoutes.js
│   ├── machineRoutes.js
│   ├── userRoutes.js
│   └── vendorRoutes.js
├── services/
│   └── mlService.js         # ML service integration
├── middleware/
│   └── errorHandler.js      # Error handling
├── utils/
│   ├── logger.js            # Winston logger
│   └── seedDatabase.js      # Database seeding
├── scripts/
│   └── seed.js              # Run seeder
├── server.js                # Entry point
├── package.json
└── .env.example             # Environment variables template
```

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure:
   - MongoDB URI
   - ML Service URL
   - JWT Secret
   - Port settings

3. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

4. **Seed the database** (optional):
   ```bash
   node scripts/seed.js
   ```

5. **Start the server**:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Machines
- `GET /api/machines` - Get all machines with ML predictions
- `GET /api/machines/:machineId` - Get specific machine with health data
- `GET /api/machines/:machineId/telemetry` - Get telemetry data
- `GET /api/machines/risk/:riskLevel` - Get machines by risk level
- `POST /api/machines` - Create new machine
- `PUT /api/machines/:machineId` - Update machine
- `POST /api/machines/:machineId/maintenance` - Add maintenance record

### Vendors
- `GET /api/vendors` - Get all vendors
- `GET /api/vendors/:id` - Get vendor by ID
- `GET /api/vendors/recommended/:machineType` - Get recommended vendors
- `POST /api/vendors` - Create new vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Deactivate vendor
- `POST /api/vendors/:id/service` - Add service record

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `GET /api/appointments/schedule/:machineId` - Get machine schedule
- `GET /api/appointments/affected/check` - Check affected appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/reschedule` - Reschedule appointment

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics
- `GET /api/analytics/costs` - Get cost analysis
- `GET /api/analytics/trends` - Get maintenance trends
- `GET /api/analytics/utilization` - Get utilization report
- `GET /api/analytics/insights` - Get predictive insights

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/summary` - Get alerts summary
- `GET /api/alerts/:id` - Get alert by ID
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/:id/acknowledge` - Acknowledge alert
- `PUT /api/alerts/:id/resolve` - Resolve alert
- `PUT /api/alerts/:id/dismiss` - Dismiss alert

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user

### Health
- `GET /health` - Server health check

## ML Service Integration

The backend communicates with the Python FastAPI ML service:

```javascript
const MLServiceClient = require('./services/mlService');

// Get machine health prediction
const prediction = await MLServiceClient.getMachineHealth('MRI_001');

// Get all machines
const allMachines = await MLServiceClient.getAllMachines();

// Check ML service health
const health = await MLServiceClient.checkHealth();
```

## Database Models

### Machine
- Machine identification and location
- Health score and risk level
- Maintenance history
- Status tracking

### Vendor
- Contact information
- Specialization and certifications
- Service rates and availability
- Ratings and service history

### Appointment
- Patient information
- Machine allocation
- Scheduling and status
- Priority levels

### Alert
- Alert types and severity
- Status tracking
- Acknowledgment and resolution
- Notification history

### User
- Authentication credentials
- Role-based access
- Preferences and settings

## Environment Variables

```env
PORT=5000
NODE_ENV=development
ML_SERVICE_URL=http://localhost:8000
MONGODB_URI=mongodb://localhost:27017/hospital_maintenance
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

## Testing

Run tests:
```bash
npm test
```

## Logging

Logs are stored in:
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs

## Security Features

- Helmet.js for security headers
- CORS enabled
- Password hashing with bcrypt
- JWT authentication
- Input validation
- Error handling middleware

## Development

```bash
# Install nodemon for auto-restart
npm install -g nodemon

# Run in development mode
npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure MongoDB connection
4. Set up reverse proxy (nginx)
5. Enable HTTPS
6. Configure logging
7. Set up monitoring

## License

MIT
