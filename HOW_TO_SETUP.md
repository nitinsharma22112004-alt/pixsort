# PixSort — Complete Setup, Configuration & Deployment Guide

This guide walks through every step required to configure, run locally, connect personal Google Drive accounts, set up Firebase & Cloud Firestore, and deploy PixSort to production.

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1: Clone & Install Dependencies](#3-step-1-clone--install-dependencies)
4. [Step 2: Google Gemini AI API Key](#4-step-2-google-gemini-ai-api-key)
5. [Step 3: Firebase Project Setup](#5-step-3-firebase-project-setup)
6. [Step 4: Enable Google Drive API](#6-step-4-enable-google-drive-api)
7. [Step 5: Cloud Firestore Database Setup & Security Rules](#7-step-5-cloud-firestore-database-setup--security-rules)
8. [Step 6: Firebase Authentication Setup](#8-step-6-firebase-authentication-setup)
9. [Step 7: Local Development Server](#9-step-7-local-development-server)
10. [Step 8: Connecting Personal Google Drive Storage](#10-step-8-connecting-personal-google-drive-storage)
11. [Step 9: Storage Lifecycle & Deletion Controls](#11-step-9-storage-lifecycle--deletion-controls)
12. [Step 10: Production Build & Deployment](#12-step-10-production-build--deployment)
13. [Step 11: Accessing the Capstone Defense Deck & Speech Script](#13-step-11-accessing-the-capstone-defense-deck--speech-script)
14. [Troubleshooting & FAQs](#14-troubleshooting--faqs)

---

## 1. Architecture Overview

PixSort is a modern personal photo management and multimodal semantic search system built on Google Cloud services:
- **Vision Intelligence**: Google Gemini 2.5 Flash (`gemini-2.5-flash`)
- **Semantic Vector Space**: Gemini Embedding 2 (`gemini-embedding-2-preview`) producing **3072-dimensional** dense vectors
- **Zero-API Search**: Sub-3ms in-memory cosine ranking ($0 search API cost)
- **Decentralized Storage**: Google Drive REST API v3 streaming (`files.get?alt=media`) pooled across personal Google accounts
- **Database & Sync**: Google Cloud Firestore NoSQL (`pixsort-62b7b`) with per-user security rules
- **Identity & Auth**: Firebase Dual-Mode Authentication (Google 1-click `drive.file` popup + Email/Password)
- **Frontend UI**: React 19 + TypeScript + Tailwind CSS (Clay Neomorphic `#EEF2F6` theme)
- **Backend Server**: Node.js + Express bound to `0.0.0.0:3000`

---

## 2. Prerequisites

Ensure you have the following installed:
- **Node.js**: v20+ recommended (v18+ supported)
- **npm**: v9+
- **Git**
- A **Google Account** (to access Google Cloud Console and Firebase)

---

## 3. Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/Om-Prakash-Verma/PixSort.git
cd PixSort
npm install
```

---

## 4. Step 2: Google Gemini AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API Key**.
3. Create a `.env` file in the root directory and add your key:

```env
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
PORT=3000
```

---

## 5. Step 3: Firebase Project Setup

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or select your existing project e.g. `pixsort-62b7b`).
3. Under **Project Settings** ➔ **General** ➔ **Your apps**, click the **Web** icon (`</>`) to register a web application.
4. Copy the `firebaseConfig` object and ensure your `firebase-applet-config.json` in the project root matches:

```json
{
  "projectId": "pixsort-62b7b",
  "appId": "1:68321745770:web:f350b09f67091736896313",
  "apiKey": "AIzaSyBgGBtqJl4mlGxgQAttCRBW7-YuiUAWKlA",
  "authDomain": "pixsort-62b7b.firebaseapp.com",
  "storageBucket": "pixsort-62b7b.firebasestorage.app",
  "messagingSenderId": "68321745770",
  "measurementId": "G-KCRW0YE0LX",
  "firestoreDatabaseId": "(default)",
  "oAuthClientId": ""
}
```

---

## 6. Step 4: Enable Google Drive API

For PixSort to pool storage and stream photos directly from Google Drive:

1. Visit the Google Cloud Console API Library for your project:
   👉 **[Enable Google Drive API](https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=68321745770)**  
   *(Replace `68321745770` with your Google Cloud Project Number if using another project).*
2. Click the blue **ENABLE** button.

---

## 7. Step 5: Cloud Firestore Database Setup & Security Rules

### Create Database
1. In the [Firebase Console](https://console.firebase.google.com/project/pixsort-62b7b/firestore), select **Firestore Database**.
2. Click **Create database**.
3. Choose a cloud location nearest to you (e.g. `asia-south1` or `us-central1`).
4. Select **Start in test mode** during initial setup.

### Production Multi-Tenant Security Rules
Go to the **Rules** tab in Firestore and paste the production rules from `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Multi-tenant check
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // Photos Collection (Strict User Isolation)
    match /photos/{photoId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid);
    }

    // Albums Collection
    match /albums/{albumId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid);
    }

    // Connected Google Drive Accounts
    match /drive_accounts/{accountId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid);
    }

    // Users Collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```
Click **Publish**.

---

## 8. Step 6: Firebase Authentication Setup

1. In the Firebase Console, go to **Authentication** ➔ **Sign-in method**.
2. Enable the following providers:
   - **Google**: Click Google, switch the toggle to **Enable**, choose your Project Support Email, and click **Save**.
   - **Email/Password**: Click Email/Password, enable **Email/Password**, and click **Save**.
3. Go to **Authentication** ➔ **Settings** ➔ **Authorized domains**.
   - Ensure `localhost` is listed.
   - If deploying to a production domain (e.g. `pixsort.com`), add it here.

---

## 9. Step 7: Local Development Server

Start the development server:

```bash
npm run dev
```

The application will bind to `0.0.0.0:3000`:
- Open **`http://localhost:3000`** in your browser.
- You will see the **Hero Landing Page** with the **Live Interactive AI Search Simulator**.
- Try clicking the sample prompts (*"happy dinner with friends"*, *"college id card"*, *"sunset on the beach"*) to see instant sub-3ms cosine vector matching before signing in.

---

## 10. Step 8: Connecting Personal Google Drive Storage

1. Click **Sign In** (or **Explore Demo as Guest**) on the homepage.
2. Navigate to **Connected Storage** in the sidebar.
3. Click **`+ Connect Google Drive`**.
4. Authenticate using Google OAuth popup (grants fine-grained `drive.file` scope).
5. The account will appear with its **15 GB** personal Drive quota.
6. Connect additional accounts to expand your storage pool ($N \times 15\text{ GB}$).

### Understanding the `data/` Directory
The backend server stores connected account metadata and OAuth tokens locally in:
- `data/drive_accounts.json` (account quota and priority)
- `data/drive_credentials.json` (OAuth access tokens)

> **Why are credentials stored here instead of Firestore?**  
> Google Drive OAuth tokens permit reading and writing to the user's Drive. Exposing raw OAuth tokens to client-side Firestore documents would be a security vulnerability. Storing them strictly on the server in `data/` guarantees they are never exposed to browser clients.

---

## 11. Step 9: Storage Lifecycle & Deletion Controls

In **Storage Settings**, users have complete lifecycle control:
- **Priority Reordering**: Use arrow buttons to change which Drive receives new uploads first.
- **Automatic Capacity Failover**: If Drive #1 has less available space than the uploaded file size, PixSort seamlessly routes the upload to Drive #2.
- **Safe Disconnection**: Deactivates the account in PixSort without deleting any files from Google Drive.
- **Delete Storage**: Click the red **"Delete Storage"** button. A safety confirmation modal appears. Deleting an account removes its registration and credentials from `data/`, leaving the user's master photos safe in Google Drive.

---

## 12. Step 10: Production Build & Deployment

### Compile Production Build
```bash
npm run build
```
This builds:
- `dist/index.html` and bundled client assets via Vite
- `dist/server.cjs` bundled backend server via esbuild

### Start Production Server
```bash
npm start
```

### Deploying to Google Cloud Run
```bash
# Build container image and deploy
gcloud run deploy pixsort \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your-gemini-key"
```

---

## 13. Step 11: Accessing the Capstone Defense Deck & Speech Script

1. **Built-in Presentation Deck**:
   - Access via the **"Presentation Deck"** / **"PPT"** button in the top navigation or sidebar.
   - Or open directly in your browser: `http://localhost:3000/#/presentation`.
   - Features 11 complete slides covering team credentials, problem statement, multimodal vectors, architecture, and benchmarks.
   - Supports light/dark mode and full keyboard controls (arrow keys, spacebar, Esc).
2. **Complete Defense Speech Script**:
   - Refer to [`PROJECT_PRESENTATION_SPEECH.txt`](./PROJECT_PRESENTATION_SPEECH.txt) for the full 10-12 minute word-for-word presentation script for Om, Palak, and Nitin, including anticipated faculty viva questions and answers.

---

## 14. Troubleshooting & FAQs

### Error: `Google Drive API has not been used in project... (403)`
👉 Visit the [Google Cloud Console Drive API Overview](https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=68321745770) and click **ENABLE**.

### Error: `Firestore (12.x): Could not reach Cloud Firestore backend (NOT_FOUND)`
👉 Click **Create database** in the [Firebase Console Firestore tab](https://console.firebase.google.com/project/pixsort-62b7b/firestore). Until created, PixSort automatically operates in fast in-memory cache mode.

### Error: `Storage full: Your connected Google Drive accounts do not have enough available storage`
👉 Connect an additional personal Google Drive account in **Storage Settings**. PixSort will automatically pool the extra 15 GB and resume uploads.
