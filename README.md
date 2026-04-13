# 🎯 Find Your Duo — Valorant Teammate Finder

> A full-stack MVP for finding the perfect Valorant duo partner based on rank, region, playstyle, and availability.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![Node](https://img.shields.io/badge/Node.js-18-green) ![MongoDB](https://img.shields.io/badge/MongoDB-8-darkgreen) ![Socket.io](https://img.shields.io/badge/Socket.io-4-black)

---

## 🚀 Features

| Feature | Status |
|---|---|
| Email + Password Auth (JWT) | ✅ |
| Google OAuth 2.0 | ✅ |
| Riot Account Linking (mock + real API) | ✅ |
| Player Matchmaking with Filters | ✅ |
| Duo Requests (send / accept / decline) | ✅ |
| Real-time Chat (Socket.io) | ✅ |
| Typing Indicators | ✅ |
| Online Presence / Last Seen | ✅ |
| Push Notifications (real-time) | ✅ |
| Profile with Rank, Roles, Agents | ✅ |
| Rank Refresh from Riot API | ✅ |
| Responsive Mobile Design | ✅ |
| Dark Valorant-inspired UI | ✅ |

---

## 📂 Folder Structure

```
find-your-duo/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, OAuth, logout
│   │   ├── userController.js      # Profile, matchmaking, duo requests
│   │   ├── chatController.js      # Conversations & messages
│   │   ├── riotController.js      # Riot API / rank simulation
│   │   └── notificationController.js
│   ├── middleware/
│   │   ├── auth.js                # JWT protect middleware
│   │   └── errorHandler.js        # Global error handler
│   ├── models/
│   │   ├── User.js                # User schema (rank, roles, requests, connections)
│   │   └── Chat.js                # Message, Conversation, Notification schemas
│   ├── routes/
│   │   ├── auth.js                # POST /api/auth/*
│   │   ├── users.js               # GET/PUT /api/users/*
│   │   ├── chat.js                # GET/POST /api/chat/*
│   │   ├── riot.js                # POST /api/riot/*
│   │   ├── notifications.js       # GET/PUT /api/notifications/*
│   │   └── matches.js             # Placeholder for match history
│   ├── socket/
│   │   └── socketManager.js       # Socket.io event handlers
│   ├── utils/
│   │   └── seed.js                # DB seeder with 8 mock players
│   ├── server.js                  # Express + Socket.io entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── AppLayout.jsx  # Sidebar, navigation, mobile header
│   │   ├── context/
│   │   │   └── authStore.js       # Zustand auth store (persist)
│   │   ├── hooks/
│   │   │   └── useSocket.js       # Socket.io hook
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── OAuthSuccessPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── FindDuoPage.jsx    # Matchmaking with filters
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── EditProfilePage.jsx
│   │   │   ├── ChatPage.jsx       # Real-time messaging
│   │   │   ├── NotificationsPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── styles/
│   │   │   └── globals.css        # Tailwind + custom CSS
│   │   ├── utils/
│   │   │   ├── api.js             # Axios instance
│   │   │   └── rankUtils.js       # Rank colors, icons, helpers
│   │   ├── App.jsx                # Routes + guards
│   │   └── main.jsx               # React entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── package.json                   # Root scripts
└── README.md
```

---

## 🛠️ Tech Stack

### Backend
- **Node.js + Express** — REST API
- **MongoDB + Mongoose** — Database with rich schemas
- **Socket.io** — Real-time events (chat, presence, notifications)
- **JWT** — Stateless authentication
- **Passport.js** — Google OAuth 2.0 strategy
- **bcryptjs** — Password hashing
- **express-validator** — Input validation
- **express-rate-limit** — API rate limiting
- **helmet** — Security headers

### Frontend
- **React 18** — UI library
- **Vite** — Build tool
- **React Router v6** — Client-side routing
- **Zustand** — Global state (auth)
- **TanStack Query** — Server state / caching
- **Framer Motion** — Animations
- **Tailwind CSS** — Utility-first styling
- **Socket.io-client** — Real-time client
- **react-hot-toast** — Toast notifications
- **Axios** — HTTP client

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

---

### 1. Clone and install

```bash
git clone <your-repo-url>
cd find-your-duo

# Install all dependencies
npm run install:all
# OR manually:
cd backend && npm install
cd ../frontend && npm install
```

---

### 2. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
NODE_ENV=development

# Your MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/find-your-duo

# Change this to a strong random secret in production
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# Google OAuth (get from console.cloud.google.com)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
CLIENT_URL=http://localhost:3000

# Riot API key (optional — app uses mock data if not set)
# Get from: https://developer.riotgames.com/
RIOT_API_KEY=
```

> **Note:** The app fully works without a Riot API key or Google OAuth credentials — rank data will be simulated and Google OAuth will show an error (email/password auth works fully without any extra config).

---

### 3. Seed the database (optional but recommended)

```bash
cd backend
npm run seed
```

This creates **8 demo players** with realistic profiles. All use password: `password123`

Demo accounts:
| Email | Rank | Region |
|---|---|---|
| sentinel@demo.com | Diamond 2 | NA |
| duelist@demo.com | Immortal 1 | NA |
| controller@demo.com | Gold 3 | EU |
| initiator@demo.com | Platinum 3 | AP |
| radiant@demo.com | Ascendant 3 | NA |
| silver@demo.com | Silver 2 | NA |
| eufragger@demo.com | Diamond 1 | EU |
| kr@demo.com | Immortal 3 | KR |

---

### 4. Run the application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App starts on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/google` | Google OAuth start |
| GET | `/api/auth/google/callback` | Google OAuth callback |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/find-duo` | Search players with filters |
| GET | `/api/users/profile/:username` | Get player profile |
| PUT | `/api/users/profile` | Update own profile |
| GET | `/api/users/connections` | Get connections & requests |
| POST | `/api/users/request/:userId` | Send duo request |
| POST | `/api/users/request/:userId/accept` | Accept request |
| POST | `/api/users/request/:userId/decline` | Decline request |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/chat/conversations` | List all conversations |
| GET | `/api/chat/:convId/messages` | Get messages |
| POST | `/api/chat/start/:userId` | Start/find conversation |
| POST | `/api/chat/:convId/send` | Send message |

### Riot
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/riot/link` | Link Riot account |
| POST | `/api/riot/refresh` | Refresh rank |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/read-all` | Mark all as read |
| PUT | `/api/notifications/:id/read` | Mark one as read |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join_conversation` | `conversationId` | Join chat room |
| `leave_conversation` | `conversationId` | Leave chat room |
| `typing_start` | `{ conversationId }` | Typing indicator on |
| `typing_stop` | `{ conversationId }` | Typing indicator off |
| `send_message` | `{ conversationId, content, tempId }` | Real-time message relay |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `notification` | `Notification` | New notification |
| `new_message` | `{ message, conversationId }` | New message received |
| `message_received` | `Message` | Message relay echo |
| `typing` | `{ userId, conversationId }` | Partner typing |
| `stop_typing` | `{ userId, conversationId }` | Partner stopped typing |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId }` | User went offline |
| `request_accepted` | `{ with: userId }` | Duo request accepted |

---

## 🗄️ Database Schema

### User
```
username, email, password (hashed)
googleId, authProvider
riotId { gameName, tagLine }, rank, region, riotPuuid
roles[], playstyleTags[], voiceChatPreference
preferredRankMin, preferredRankMax
availability { monday[], tuesday[], ... }
bio, favoriteAgents[]
isOnline, lastSeen, isProfileComplete
sentRequests[], receivedRequests[], connections[]
wins, losses, duoRating
```

### Conversation
```
participants[] → User refs
lastMessage → Message ref
lastActivity, isActive
```

### Message
```
conversation → Conversation ref
sender → User ref
content, messageType
readBy[] → User refs
isDeleted
```

### Notification
```
recipient, sender → User refs
type: duo_request | request_accepted | request_declined | new_message | system
title, message, isRead, data
```

---

## 🔒 Security Features

- Passwords hashed with bcryptjs (12 salt rounds)
- JWT stored in httpOnly cookies + Authorization header support
- Helmet.js for HTTP security headers
- Rate limiting (100 req/15 min per IP)
- Input validation via express-validator
- Route protection middleware on all private endpoints
- Password field excluded from all DB queries by default (`select: false`)
- Google OAuth with automatic account merging

---

## 🚀 Production Deployment Notes

1. Set `NODE_ENV=production` in environment
2. Use a strong `JWT_SECRET` (32+ random chars)
3. Set `MONGODB_URI` to your Atlas cluster
4. Set `CLIENT_URL` to your frontend domain
5. Enable HTTPS — set `secure: true` on cookies
6. Use a process manager like PM2 for the backend
7. Build the frontend: `cd frontend && npm run build`
8. Serve built frontend from Express or a CDN

---

## 🧩 Future Improvements

- [ ] Squad finder (3-5 player parties)
- [ ] Match history integration (Riot API)
- [ ] Agent stats from Tracker.gg
- [ ] In-game LFG status overlay
- [ ] Voice channel integration (Discord SDK)
- [ ] Rating system for duo partners
- [ ] Scheduled availability calendar
- [ ] Mobile app (React Native)

---

*Built as a startup MVP — scalable, clean, and production-ready.*
