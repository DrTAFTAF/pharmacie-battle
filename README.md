# Pharmacie Battle

A multiplayer quiz game for pharmacy students and professionals to test their knowledge in a fun, competitive environment.

## Project Overview

Pharmacie Battle is a real-time multiplayer quiz game built with React, TypeScript, and Firebase. Players can create or join game rooms, answer pharmacy-related questions, and use special bonuses to gain advantages or hinder opponents.

## Features

- Real-time multiplayer gameplay
- Pharmacy-themed questions and challenges
- Special bonuses and power-ups
- Leaderboard and scoring system
- Anonymous authentication

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Build Tool**: Vite

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
│   │   └── …  
│   ├── context/
│   │   └── GameContext.tsx        # Game state management
│   ├── data/                      # Local data for development
│   ├── styles/
│   │   └── tailwind.css           # Tailwind CSS imports
│   ├── App.tsx                    # Main application component
│   └── main.tsx                   # Application entry point
├── functions/                     # Cloud Functions
│   ├── src/
│   │   ├── data/                  # Data for Cloud Functions
│   │   ├── logger.ts              # Logging utility
│   │   ├── index.ts               # Functions entry point
│   │   ├── startGame.ts           # Game initialization
│   │   ├── answerQuestion.ts      # Answer processing
│   │   ├── acquireClient.ts       # Client acquisition
│   │   └── useBonus.ts            # Bonus application
│   └── package.json               # Functions dependencies
└── firebase.json                  # Firebase configuration
```

## Setup and Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a Firebase project and update `.env` with your Firebase configuration
4. Install Firebase tools: `npm install -g firebase-tools`
5. Login to Firebase: `firebase login`
6. Initialize Firebase emulators: `firebase init emulators`
7. Start the development server: `npm run dev`
8. Start Firebase emulators: `firebase emulators:start`

## Development

- Frontend: `npm run dev`
- Firebase emulators: `firebase emulators:start`
- Cloud Functions: `cd functions && npm run build:watch`

## Deployment

- Deploy to Firebase: `firebase deploy`
- Deploy only hosting: `firebase deploy --only hosting`
- Deploy only functions: `firebase deploy --only functions`
