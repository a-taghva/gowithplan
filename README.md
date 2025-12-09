# GoWithPlan

A full-stack quiz application for exam preparation with topic-based learning and progress tracking.

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)

## Features

- **Topic-Based Learning** - Organize questions by topic with individual progress tracking
- **Three Quiz Modes**:
  - **Remaining** - Practice questions you haven't answered yet
  - **Mistakes** - Review questions you got wrong
  - **Mastered** - Revisit questions you've answered correctly
- **Smart Progress Tracking** - Questions move between modes based on your answers
- **Favorites System** - Save important questions for quick reference
- **Progress Reset** - Reset progress per topic or globally
- **Google Authentication** - Secure sign-in with Google via Firebase
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

### Frontend
- React 18
- React Router 6
- Framer Motion (animations)
- Axios (HTTP client)

### Backend
- Node.js
- Express 4
- Mongoose 8

### Database
- MongoDB

### Authentication
- Firebase Authentication (Google Sign-In)
- Firebase Admin SDK (token verification)

## Project Structure

```
gowithplan/
├── client/                   # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── Navbar.js
│   │   │   └── Navbar.css
│   │   ├── context/          # React context
│   │   │   └── AuthContext.js
│   │   ├── pages/            # Page components
│   │   │   ├── Login.js
│   │   │   ├── Topics.js
│   │   │   ├── Quiz.js
│   │   │   ├── Results.js
│   │   │   ├── Favorites.js
│   │   │   └── Settings.js
│   │   ├── App.js
│   │   ├── firebase.js       # Firebase configuration
│   │   └── index.js
│   ├── env.template          # Environment template
│   └── package.json
├── server/                   # Express backend
│   ├── middleware/
│   │   └── auth.js           # Token verification
│   ├── models/
│   │   ├── User.js
│   │   ├── Topic.js
│   │   └── Question.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── topics.js
│   │   └── quiz.js
│   ├── config.js
│   └── server.js
├── package.json              # Root package with scripts
├── Procfile                  # Heroku deployment
└── README.md
```

## Prerequisites

- **Node.js** 18.x or higher
- **MongoDB** database (local or MongoDB Atlas)
- **Firebase Project** with Authentication enabled

## Environment Variables

### Client (`client/.env`)

Create a `.env` file in the `client` directory:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Server (`server/.env`)

Create a `.env` file in the `server` directory:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id

# Server
PORT=5000
```

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gowithplan.git
   cd gowithplan
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```
   This installs dependencies for root, server, and client.

3. **Configure environment variables**
   - Copy `client/env.template` to `client/.env` and fill in your Firebase config
   - Create `server/.env` with your MongoDB URI and Firebase project ID

4. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Google Sign-In under Authentication > Sign-in method
   - Add your domain to authorized domains (include `localhost` for development)

5. **Set up MongoDB**
   - Create a MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
   - Create collections: `users`, `topics`, `questions`
   - Add your topics and questions to the database

## Running the Application

### Development Mode

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

- Frontend runs on: `http://localhost:3000`
- Backend runs on: `http://localhost:5000`

### Production Mode

```bash
# Build the client
cd client && npm run build

# Start the server
npm start
```

## API Endpoints

All endpoints except health check require Firebase authentication token in the `Authorization` header.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login/register user |
| GET | `/api/auth/me` | Get current user |
| DELETE | `/api/auth/progress` | Reset all progress |
| DELETE | `/api/auth/account` | Delete account |

### Topics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/topics` | Get all topics with progress counts |
| DELETE | `/api/topics/:topicId/progress` | Reset progress for a topic |
| DELETE | `/api/topics/:topicId/favorites` | Clear favorites for a topic |
| GET | `/api/topics/:topicId/favorites` | Get favorite questions for a topic |

### Quiz

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quiz/:topicId/:mode` | Get questions (mode: remaining/mistakes/mastered) |
| POST | `/api/quiz/submit` | Submit quiz results |
| POST | `/api/quiz/favorite` | Toggle favorite status |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

## Database Schema

### User

```javascript
{
  firebaseUid: String,      // Firebase user ID
  email: String,            // User email
  displayName: String,      // Display name
  progression: [{
    topicId: ObjectId,      // Reference to Topic
    answeredQuestions: [{
      questionId: String,
      isCorrect: Boolean
    }],
    favoriteQuestions: [String]  // Array of questionIds
  }]
}
```

### Topic

```javascript
{
  topicId: String,          // Unique topic identifier
  topic: String,            // Topic name
  questionCount: Number     // Total questions in topic
}
```

### Question

```javascript
{
  topicId: String,          // Reference to topic
  topic: String,            // Topic name
  questionId: String,       // Unique question identifier
  question: String,         // Question text
  options: [String],        // Multiple choice options (optional)
  answer: String,           // Correct answer
  explanation: String       // Explanation (optional)
}
```

## Deployment

### Heroku

1. Create a Heroku app:
   ```bash
   heroku create your-app-name
   ```

2. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set FIREBASE_PROJECT_ID=your_project_id
   heroku config:set NODE_ENV=production
   ```

3. Deploy:
   ```bash
   git push heroku main
   ```

The `Procfile` is already configured to run the server, and `heroku-postbuild` script handles building the client.

### Other Platforms

The app can be deployed to any Node.js hosting platform. Ensure you:
1. Set all required environment variables
2. Build the client before starting the server
3. Set `NODE_ENV=production`

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run server` | Start backend in development mode |
| `npm run client` | Start frontend in development mode |
| `npm run dev` | Run both frontend and backend |
| `npm run install-all` | Install all dependencies |

## License

MIT

