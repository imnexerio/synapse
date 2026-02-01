# Synapse

A knowledge graph PWA for UPSC aspirants to track and connect daily news topics. Visualize relationships between current affairs to better understand the big picture.

![Synapse](public/icons/icon.png)

## Features

- **3D Sphere View** - Immersive 360° visualization with gyroscope support
- **2D Mind Map** - Flat plane view for easy navigation
- **List View** - Traditional list of all topics
- **Firebase Auth** - Google and Email/Password authentication
- **Real-time Sync** - Data synced across devices via Firebase
- **PWA Support** - Install on mobile/desktop for offline access
- **Deterministic Colors** - Tags get consistent colors based on their names

## Tech Stack

- **React 19** + Vite
- **Three.js** via @react-three/fiber and @react-three/drei
- **Zustand** for state management
- **Firebase** - Authentication & Realtime Database
- **vite-plugin-pwa** for PWA features

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Authentication and Realtime Database enabled

### Installation

```bash
# Clone the repo
git clone https://github.com/imnexerio/synapse.git
cd synapse

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Configuration

Edit `.env.local` with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Firebase Rules

Set these rules in Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### Development

```bash
npm run dev
```

### Build & Deploy

```bash
npm run build
firebase deploy
```

## Project Structure

```
src/
├── components/     # 3D scene components
├── services/       # Firebase auth & database
├── store/          # Zustand state management
├── ui/             # UI components (TabBar, Forms, etc.)
├── utils/          # Color generation utilities
└── views/          # View components (Sphere, Plane, List, Profile)
```

## License

MIT
