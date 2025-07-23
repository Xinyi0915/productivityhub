# ProductivityHub Backend API

This is the backend API for the ProductivityHub application. It provides authentication, user management, and data storage for the frontend application.

## Setup Instructions

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB (local installation or MongoDB Atlas account)

### Installation

1. Install dependencies:

```bash
cd server
npm install
```

2. Create a `.env` file in the server directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/productivityhub
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=30d
```

Modify the `MONGODB_URI` to point to your MongoDB instance and choose a secure random string for `JWT_SECRET`.

### Running the Server

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Request: `{ username, email, password }`
  - Response: `{ status, token, user }`

- `POST /api/auth/login` - Login a user
  - Request: `{ email, password }`
  - Response: `{ status, token, user }`

- `GET /api/auth/me` - Get current user profile (protected)
  - Response: `{ status, user }`

### User Management

- `PATCH /api/users/profile` - Update user profile (protected)
  - Request: `{ username, email }`
  - Response: `{ status, user }`

- `PATCH /api/users/password` - Update user password (protected)
  - Request: `{ currentPassword, newPassword }`
  - Response: `{ status, message }`

- `PATCH /api/users/coins` - Update user coins (protected)
  - Request: `{ coins }`
  - Response: `{ status, user }`

### Tasks

- `GET /api/tasks` - Get all tasks (protected)
  - Query params: `completed`, `category`, `dueDate`, `sortBy`, `sortOrder`, `limit`, `page`
  - Response: `{ status, results, totalPages, currentPage, data }`

- `GET /api/tasks/:id` - Get a specific task (protected)
  - Response: `{ status, data }`

- `POST /api/tasks` - Create a new task (protected)
  - Request: `{ title, description, dueDate, priority, category, ... }`
  - Response: `{ status, data }`

- `PATCH /api/tasks/:id` - Update a task (protected)
  - Request: Task fields to update
  - Response: `{ status, data }`

- `DELETE /api/tasks/:id` - Delete a task (protected)
  - Response: `{ status, message }`

- `PATCH /api/tasks/reorder` - Reorder tasks (protected)
  - Request: `{ tasks: [{ id, order }, ...] }`
  - Response: `{ status, message }`

### Habits

- `GET /api/habits` - Get all habits (protected)
  - Query params: `active`, `category`, `frequency`, `sortBy`, `sortOrder`
  - Response: `{ status, results, data }`

- `GET /api/habits/:id` - Get a specific habit (protected)
  - Response: `{ status, data }`

- `POST /api/habits` - Create a new habit (protected)
  - Request: `{ name, description, frequency, category, ... }`
  - Response: `{ status, data }`

- `PATCH /api/habits/:id` - Update a habit (protected)
  - Request: Habit fields to update
  - Response: `{ status, data }`

- `DELETE /api/habits/:id` - Delete a habit (protected)
  - Response: `{ status, message }`

- `POST /api/habits/:id/checkin` - Add a check-in for a habit (protected)
  - Request: `{ date, notes }`
  - Response: `{ status, data }`

- `DELETE /api/habits/:id/checkin/:checkInId` - Remove a check-in (protected)
  - Response: `{ status, data }`

### Timer Sessions

- `GET /api/timer-sessions` - Get all timer sessions (protected)
  - Query params: `type`, `startDate`, `endDate`, `limit`, `page`
  - Response: `{ status, results, totalPages, currentPage, data }`

- `GET /api/timer-sessions/:id` - Get a specific timer session (protected)
  - Response: `{ status, data }`

- `POST /api/timer-sessions` - Create a new timer session (protected)
  - Request: `{ startTime, endTime, duration, type, ... }`
  - Response: `{ status, data }`

- `PATCH /api/timer-sessions/:id` - Update a timer session (protected)
  - Request: Timer session fields to update
  - Response: `{ status, data }`

- `DELETE /api/timer-sessions/:id` - Delete a timer session (protected)
  - Response: `{ status, message }`

- `GET /api/timer-sessions/stats` - Get timer statistics (protected)
  - Query params: `startDate`, `endDate`
  - Response: `{ status, data: { summary, dailyStats } }`

### Garden

- `GET /api/garden` - Get all garden items (protected)
  - Query params: `type`, `growthStage`, `isVisible`
  - Response: `{ status, results, data }`

- `GET /api/garden/:id` - Get a specific garden item (protected)
  - Response: `{ status, data }`

- `POST /api/garden` - Create a new garden item (protected)
  - Request: `{ type, itemId, name, position, cost, ... }`
  - Response: `{ status, data }`

- `PATCH /api/garden/:id` - Update a garden item (protected)
  - Request: Garden item fields to update
  - Response: `{ status, data }`

- `DELETE /api/garden/:id` - Delete a garden item (protected)
  - Response: `{ status, message }`

- `PATCH /api/garden/:id/grow` - Grow a garden item (protected)
  - Request: `{ incrementBy }`
  - Response: `{ status, data }`

- `GET /api/garden/stats` - Get garden statistics (protected)
  - Response: `{ status, data: { summary, typeStats } }`

### Achievements

- `GET /api/achievements` - Get all achievements (protected)
  - Query params: `completed`, `category`, `tier`, `hidden`
  - Response: `{ status, results, data }`

- `GET /api/achievements/:id` - Get a specific achievement (protected)
  - Response: `{ status, data }`

- `POST /api/achievements` - Create a new achievement (protected)
  - Request: `{ achievementId, name, description, category, ... }`
  - Response: `{ status, data }`

- `PATCH /api/achievements/:id/progress` - Update achievement progress (protected)
  - Request: `{ progress }`
  - Response: `{ status, data }`

- `POST /api/achievements/:id/claim` - Claim achievement reward (protected)
  - Response: `{ status, data: { achievement, coinsRewarded } }`

- `DELETE /api/achievements/:id` - Delete an achievement (protected)
  - Response: `{ status, message }`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header as follows:

```
Authorization: Bearer your_jwt_token
```

## Development

This backend is built with:

- Express.js - Web framework
- MongoDB & Mongoose - Database and ORM
- JWT - Authentication
- bcryptjs - Password hashing