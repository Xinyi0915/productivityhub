# Productivity Hub

A comprehensive productivity application built with React, TypeScript, and Redux.

## Deployment Status
- ✅ TypeScript errors fixed
- ✅ Timer slice createAsyncThunk import resolved
- ✅ Build configuration optimized
- ✅ Package.json verified and working
- 🔄 Forcing Vercel to use correct commit (262e102)

## Fixed TypeScript errors

## Features

- Secure user authentication with JWT
- Task management with priority levels and categories
- Habit tracking with streaks and statistics
- Basic focus timer for productivity
- Interactive garden that grows based on productivity

## Project Structure

- `/src` - Frontend React application
- `/server` - Backend Express API

## Setup Instructions

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB (local installation or MongoDB Atlas account)

### Backend Setup

1. Navigate to the server directory and install dependencies:

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

3. Start the backend server:

```bash
npm run dev
```

### Frontend Setup

1. In the root directory, install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with:

```
VITE_API_URL=http://localhost:5000/api
```

3. Start the frontend development server:

```bash
npm run dev
```

### Running Both Frontend and Backend

To run both frontend and backend concurrently:

```bash
npm run dev:all
```

## Deployment

### Quick Deployment Guide

#### Frontend (Vercel)

1. Push your code to GitHub
2. Import your repository into Vercel
3. Set the environment variable `VITE_API_URL` to your backend URL
4. Deploy

#### Backend (Render or Heroku)

1. Create a MongoDB Atlas database
2. Deploy the server directory to Render or Heroku
3. Set the required environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL` (your Vercel frontend URL)
4. Ensure CORS is properly configured to allow requests from your frontend

## Development

### Technologies Used

- **Frontend**:
  - React with TypeScript
  - Redux Toolkit for state management
  - React Router for routing
  - TailwindCSS for styling
  - Vite for build tooling

- **Backend**:
  - Express.js
  - MongoDB with Mongoose
  - JWT for authentication
  - bcrypt for password hashing

### Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── store/         # Redux store and slices
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
├── api/           # API client and endpoints
└── assets/        # Static assets
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run serve` - Preview production build
- `npm run test` - Run tests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)