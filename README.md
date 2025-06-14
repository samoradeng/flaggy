# Flagtriv - Multiplayer Setup Guide

## 🚨 Important: Multiplayer Backend Required

The current multiplayer implementation uses **localStorage** which only works on the same device/browser. To enable **real multiplayer** between different devices, you need to set up a backend server.

## 🔧 Backend Options

### Option 1: Firebase Realtime Database (Recommended)
```javascript
// In js/multiplayerSync.js, replace the backend URL:
this.backendUrl = 'https://your-firebase-project.firebaseio.com';
```

### Option 2: Supabase Realtime
```javascript
// In js/multiplayerSync.js:
this.backendUrl = 'https://your-project.supabase.co/rest/v1';
```

### Option 3: Custom Node.js Backend
Create a simple Express.js server with Socket.io for real-time updates.

## 🛠️ Quick Setup with Firebase

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Realtime Database

2. **Update Configuration**
   ```javascript
   // In js/multiplayerSync.js
   this.useRealBackend = true;
   this.backendUrl = 'https://your-project-default-rtdb.firebaseio.com';
   ```

3. **Deploy to Production**
   - The multiplayer will only work on the deployed version
   - Local development uses localStorage fallback

## 📱 Current Status

- ✅ **Single Device**: Works perfectly (localStorage)
- ❌ **Multiple Devices**: Requires backend setup
- ✅ **UI/UX**: Fully functional
- ✅ **Game Logic**: Complete

## 🚀 Next Steps

1. Set up Firebase or another real-time database
2. Update the backend URL in `multiplayerSync.js`
3. Deploy to production
4. Test multiplayer between different devices

The game is fully functional for single-device testing and all other features work perfectly!