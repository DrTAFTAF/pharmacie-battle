# Pharmacie Battle

A multiplayer quiz game for pharmacy students and professionals to test their knowledge in a fun, competitive environment.

## Project Overview

Pharmacie Battle is a real-time multiplayer quiz game built with React, TypeScript, and Firebase. Players can create or join game rooms, answer pharmacy-related questions, and use special bonuses to gain advantages or hinder opponents.

## Features

- Real-time multiplayer gameplay
- Pharmacy-themed questions and challenges
- Special bonuses and power-ups
- Leaderboard and scoring system (via Firestore collection: `scores/`)
- Anonymous authentication

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Build Tool**: Vite
- **Configuration**: vite.config.ts, tailwind.config.js, postcss.config.js
- **Error Handling**: Centralized error handling via Firebase logging

## Project Structure

```
pharmacie-battle/
├── data/                          # "Source of truth" for game data
│   ├── config.json                # Game configuration
│   ├── questions.json             # Question database
│   └── bonuses.json               # Bonus items database
├── public/
│   └── index.html
├── rules/
│   └── firestore.rules            # Firestore security rules
├── src/                           # Front-end
│   ├── api/
│   │   └── firebase.ts            # Firebase initialization
│   ├── components/
│   │   ├── Lobby.tsx              # Game lobby component
│   │   ├── PlayerInput.tsx        # Player input component
│   │   ├── PlayerList.tsx         # Player list component
│   │   ├── QuizCard.tsx           # Question display component
│   │   ├── BonusCard.tsx          # Bonus item component
│   │   ├── ClientCounter.tsx      # Client acquisition tracker
│   │   └── Leaderboard.tsx        # Game leaderboard component
│   ├── context/
│   │   └── GameContext.tsx        # Game state management
│   ├── data/                      # Local data for development
│   │   ├── config.json            # Copy of /data/config.json
│   │   ├── questions.json         # Copy of /data/questions.json
│   │   └── bonuses.json           # Copy of /data/bonuses.json
│   ├── styles/
│   │   └── tailwind.css           # Tailwind CSS imports
│   ├── App.tsx                    # Main application component
│   └── index.tsx                  # Application entry point
├── functions/                     # Cloud Functions
│   ├── src/
│   │   ├── data/                  # Data for Cloud Functions seeding
│   │   │   ├── config.json        # Copy of /data/config.json
│   │   │   ├── questions.json     # Copy of /data/questions.json
│   │   │   └── bonuses.json       # Copy of /data/bonuses.json
│   │   ├── logger.ts              # Logging utility
│   │   ├── index.ts               # Functions entry point
│   │   ├── startGame.ts           # Game initialization
│   │   ├── answerQuestion.ts      # Answer processing
│   │   ├── acquireClient.ts       # Client acquisition
│   │   └── useBonus.ts            # Bonus application
│   ├── package.json               # Functions dependencies
│   ├── tsconfig.json              # TypeScript configuration for functions
│   └── .eslintrc.js               # ESLint configuration for functions
├── .env                           # Environment variables (NOT in git)
├── .gitignore                     # Git ignore file (includes .env)
├── .eslintrc.js                  # ESLint configuration for frontend
├── tsconfig.json                  # TypeScript configuration for frontend
├── firebase.json                  # Firebase configuration
├── firestore.indexes.json         # Firestore indexes
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── vite.config.ts                 # Vite configuration (includes console stripping)
├── package.json                   # Project dependencies and scripts
└── README.md                      # Project documentation
```

## Setup and Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a Firebase project and update `.env` with your Firebase configuration:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   FIREBASE_LOG_BUCKET=pharmacie-battle-logs
   ```

   **Important:** `.env` is already added to `.gitignore` to prevent exposing credentials. Never commit this file.

4. Install Firebase tools: `npm install -g firebase-tools`
5. Login to Firebase: `firebase login`
6. Initialize Firebase emulators with specific services:

   ```bash
   firebase init emulators --only auth,firestore,functions,storage
   ```

7. Start the development server: `npm run dev`
8. Start Firebase emulators: `npm run emulators`

## Package Scripts

### Root package.json

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "emulators": "firebase emulators:start",
  "deploy": "npm run build && firebase deploy --only hosting",
  "deploy:functions": "firebase deploy --only functions",
  "deploy:rules": "firebase deploy --only firestore:rules",
  "deploy:all": "npm run build && firebase deploy"
}
```

### functions/package.json

```json
"scripts": {
  "lint": "eslint --ext .js,.ts .",
  "build": "tsc",
  "build:watch": "tsc --watch",
  "serve": "npm run build && firebase emulators:start --only functions",
  "shell": "npm run build && firebase functions:shell",
  "start": "npm run shell",
  "deploy": "firebase deploy --only functions",
  "logs": "firebase functions:log"
}
```

## Development

- Frontend: `npm run dev`
- Firebase emulators: `npm run emulators`
- Cloud Functions: `cd functions && npm run build:watch`
- Logs: All server logs are redirected to Firebase Storage bucket named by `FIREBASE_LOG_BUCKET`. Access them via:

  ```bash
  firebase functions:log
  # or directly via Storage
  # gs://pharmacie-battle-logs/YYYY-MM-DD.log
  ```

## Console Logging

In development, all console logs are preserved. In production, only `console.log` statements are automatically stripped using `babel-plugin-transform-remove-console` configured in `vite.config.ts`. Note that `console.error` and `console.warn` are preserved for debugging critical issues.

If you want to remove all console output in production, update the babel plugins in `vite.config.ts`:

```js
plugins: ['transform-remove-console', 'transform-remove-debugger']
```

## Leaderboard & Scores Collection

The `scores/` Firestore collection is populated at the end of each game via Cloud Functions. When a game reaches the "finished" state, the `endGame` Cloud Function automatically creates a document in `scores/{gameId}` with the final player rankings and statistics. This data is then used by the Leaderboard component to display historical game results.

## Security & Rules

Firestore security rules enforce the following restrictions:

- Client-side writes to `/games/{gameId}` are disabled (`allow write: if false`)
- All game state mutations must go through Cloud Functions
- Players can only read/write their own data in `/games/{gameId}/players/{playerId}`
- The Firestore schema includes collections for `games/`, `players/`, `questions/`, `bonuses/`, and `scores/`

## Firebase Configuration

The `firebase.json` file includes configuration for Firestore, Functions, Hosting, and Emulators:

```json
{
  "firestore": {
    "rules": "rules/firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run lint",
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ],
    "source": "functions"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "emulators": {
    "auth": { "port": 9099 },
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "hosting": { "port": 5000 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true }
  }
}
```

## Deployment

- Deploy frontend only: `npm run deploy`
- Deploy functions only: `npm run deploy:functions`
- Deploy Firestore rules only: `npm run deploy:rules`
- Deploy everything: `npm run deploy:all`
