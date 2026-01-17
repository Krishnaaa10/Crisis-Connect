# 🚨 Crisis Connect - Disaster Management Platform

A next-generation MERN stack disaster management platform featuring real-time coordination between civilians, volunteers, and emergency responders with a premium tactical command center aesthetic.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://www.mongodb.com/)

## ✨ Features

### 🎯 **Three Distinct Portals**

#### 🏛️ **Admin Dashboard**
- Comprehensive incident management (CRUD operations)
- Volunteer coordination and tracking
- System-wide controls and analytics
- Real-time statistics and monitoring
- Tactical command center interface

#### 🛡️ **Volunteer Portal**
- **Active Missions**: Track accepted incidents
- **Incident Pool**: Browse and accept available incidents
- **📍 Tactical Map**: Live map with severity-coded markers
- **🏆 Achievements System**: 4 unlockable badges with progress tracking
- **📢 System Announcements**: Real-time broadcast feed
- **HUD Interface**: Military-style tactical display

#### 👥 **Civilian Dashboard**
- **Live Incident Map**: Interactive Leaflet map with real-time markers
- **Report Incident**: Modal and dedicated page with immersive design
- **Crisis Guide**: Emergency response information
- **Activity Feed**: Real-time crisis updates

### 🌟 **Premium Features**

- **🌌 Immersive About Page**
  - Animated particle background (100+ particles)
  - Glitch text effects with RGB split
  - 3D flip cards
  - Glassmorphism UI elements
  - Holographic scanning effects

- **🚨 Alerts & Incidents Page**
  - Dual data display (broadcasts + incidents)
  - Tab navigation (All, Broadcasts, Incidents)
  - Real-time Socket.IO updates
  - Animated grid background
  - Staggered card animations

- **🔐 Advanced Authentication**
  - Multi-tab sync (prevents auth conflicts)
  - Role-based routing
  - Google OAuth integration
  - JWT-based security

## 🎨 Design System

### **Visual Aesthetic**
- **Theme**: Tactical command center / Cyberpunk
- **Color Palette**:
  - Primary Dark: `#050a14`
  - Accent Cyan: `#00f0ff`
  - Severity Colors: Green → Yellow → Orange → Red
- **Effects**: Glassmorphism, particle systems, 3D transforms, parallax scrolling

### **Typography**
- Headers: Orbitron (Sci-fi)
- Body: Inter (Readability)
- Gradient text effects throughout

## 🚀 Tech Stack

### **Frontend**
- React 18+
- React Router (client-side routing)
- React Query (server state management)
- Socket.IO Client (real-time updates)
- Leaflet (interactive maps)
- React Toastify (notifications)
- Axios (HTTP client)

### **Backend**
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO (real-time communication)
- JWT (authentication)
- Nodemailer (email service)

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Step 1: Clone Repository

```bash
git clone https://github.com/Krishnaaa10/Crisis-Connect.git
cd Crisis-Connect
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 3: Configure Environment Variables

Create `.env` in the `backend` folder:

```env
MONGODB_URI=mongodb://localhost:27017/crisis-connect
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Email Configuration (Optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
```

Create `.env` in the `frontend` folder:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

### Step 4: Start MongoDB

```bash
# Windows (if installed as service)
# MongoDB should start automatically

# Mac/Linux
sudo systemctl start mongod
# or
mongod
```

### Step 5: Run the Application

**Option 1: Run both servers separately**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

**Option 2: Run concurrently (from root)**

```bash
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

## 👥 User Roles

### **Civilian**
- Register and login
- Report incidents with location
- View live incident map
- Access crisis guide
- Track personal reports

### **Volunteer**
- Browse incident pool
- Accept and manage missions
- View tactical map
- Earn achievements
- Receive system announcements

### **Admin**
- Manage all incidents
- Coordinate volunteers
- Broadcast alerts
- Access system analytics
- Full CRUD operations

### **Creating Admin Account**

```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user

### Incidents
- `GET /api/incidents` - Get all incidents (filtered by role)
- `GET /api/incidents/:id` - Get single incident
- `POST /api/incidents` - Create incident
- `PUT /api/incidents/:id` - Update incident
- `POST /api/incidents/:id/accept` - Accept incident (Volunteer)
- `POST /api/incidents/:id/resolve` - Resolve incident
- `DELETE /api/incidents/:id` - Delete incident (Admin)

### Alerts
- `GET /api/alerts` - Get all alerts
- `POST /api/alerts` - Create alert (Admin)
- `PUT /api/alerts/:id` - Update alert (Admin)
- `DELETE /api/alerts/:id` - Delete alert (Admin)

### Admin
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/volunteers` - Get all volunteers
- `GET /api/admin/incidents` - Get all incidents

## 🌐 Real-Time Features

Socket.IO events:
- `incident-created` - New incident reported
- `incident-updated` - Incident status changed
- `incident-deleted` - Incident removed
- `new-alert` - Admin broadcast
- `alert-updated` - Alert modified
- `alert-deleted` - Alert removed

## 🎯 Key Features Implemented

✅ **Volunteer Portal Enhancements**
- Tactical map with severity-coded markers
- Achievement system with 4 unlockable badges
- System announcements banner
- Progress tracking

✅ **Immersive About Page**
- Particle animation system
- 3D card flips
- Glitch text effects
- Holographic images

✅ **Alerts System**
- Dual data display (broadcasts + incidents)
- Tab navigation
- Real-time updates
- Premium animations

✅ **Authentication Fixes**
- Multi-tab sync
- Role-based routing
- Volunteer redirect fix

✅ **Visual Enhancements**
- Background images on all pages
- Animated grids
- Glassmorphism effects
- Tactical aesthetic

## 🧪 Testing Multiple Users

To test different roles simultaneously, use:
- **Chrome**: Login as Civilian
- **Firefox**: Login as Admin
- **Chrome Incognito**: Login as Volunteer

Each browser has isolated storage, preventing conflicts.

## 🚀 Deployment

### Recommended Platforms
- **Backend**: Render, Railway, Heroku
- **Frontend**: Vercel, Netlify
- **Database**: MongoDB Atlas (free tier)

### Environment Variables

**Backend (Production)**
```env
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<secure-random-string>
CLIENT_URL=<your-frontend-url>
NODE_ENV=production
```

**Frontend (Production)**
```env
REACT_APP_API_URL=<your-backend-url>
```

## 📁 Project Structure

```
Crisis-Connect/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth & error handling
│   │   ├── services/        # Email, etc.
│   │   ├── utils/           # Helper functions
│   │   ├── config/          # Database config
│   │   ├── app.js           # Express app
│   │   └── server.js        # Server entry
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── assets/          # Images, backgrounds
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── context/         # Auth context
│   │   ├── utils/           # Axios config
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- For Atlas, whitelist your IP

### Socket.IO Issues
- Verify backend is on port 5000
- Check CORS settings
- Ensure `CLIENT_URL` matches frontend

### Port Conflicts
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👨‍💻 Author

**ShriKrishna Patel**
- GitHub: [@Krishnaaa10](https://github.com/Krishnaaa10)
- LinkedIn: [shrikrishnapatel10](https://www.linkedin.com/in/shrikrishnapatel10/)
- Email: krishnaspattel@gmail.com

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- Unsplash for background images
- React community for amazing tools

---

**Built with ❤️ for saving lives and coordinating emergency response**

🚨 **Crisis Connect - Where Technology Meets Humanity** 🚨
