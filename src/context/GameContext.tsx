import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../api/firebase';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';

// Define types
type Player = {
  id: string;
  name: string;
  score: number;
  bonuses: string[];
};

type GameState = {
  id: string;
  status: 'waiting' | 'playing' | 'finished';
  currentRound: number;
  currentQuestion: string | null;
  players: Player[];
};

type GameContextType = {
  gameState: GameState | null;
  currentPlayer: Player | null;
  isHost: boolean;
  createGame: () => Promise<string>;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  startGame: () => Promise<void>;
  submitAnswer: (answer: string) => Promise<boolean>;
  useBonus: (bonusId: string, targetPlayerId?: string) => Promise<void>;
};

// Create context
const GameContext = createContext<GameContextType | null>(null);

// Create provider component
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isHost, setIsHost] = useState(false);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && gameState) {
        const player = gameState.players.find(p => p.id === user.uid);
        if (player) {
          setCurrentPlayer(player);
        }
      } else {
        setCurrentPlayer(null);
      }
    });

    return () => unsubscribe();
  }, [gameState]);

  // Create a new game
  const createGame = async (): Promise<string> => {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameRef = doc(db, 'games', gameId);
    
    const initialGameState: GameState = {
      id: gameId,
      status: 'waiting',
      currentRound: 0,
      currentQuestion: null,
      players: [{
        id: auth.currentUser.uid,
        name: 'Host',
        score: 0,
        bonuses: []
      }]
    };
    
    await setDoc(gameRef, initialGameState);
    setIsHost(true);
    
    // Subscribe to game updates
    subscribeToGame(gameId);
    
    return gameId;
  };

  // Join an existing game
  const joinGame = async (gameId: string, playerName: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameSnap.data() as GameState;
    
    if (gameData.status !== 'waiting') {
      throw new Error('Game already started');
    }
    
    // Check if player is already in the game
    const existingPlayer = gameData.players.find(p => p.id === auth.currentUser?.uid);
    
    if (!existingPlayer) {
      // Add player to the game
      const updatedPlayers = [
        ...gameData.players,
        {
          id: auth.currentUser.uid,
          name: playerName,
          score: 0,
          bonuses: []
        }
      ];
      
      await setDoc(gameRef, { players: updatedPlayers }, { merge: true });
    }
    
    // Subscribe to game updates
    subscribeToGame(gameId);
  };

  // Subscribe to game updates
  const subscribeToGame = (gameId: string) => {
    const gameRef = doc(db, 'games', gameId);
    
    return onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.data() as GameState;
        setGameState(gameData);
        
        // Update current player
        if (auth.currentUser) {
          const player = gameData.players.find(p => p.id === auth.currentUser?.uid);
          if (player) {
            setCurrentPlayer(player);
          }
        }
      }
    });
  };

  // Start the game
  const startGame = async (): Promise<void> => {
    if (!gameState || !isHost) {
      throw new Error('Only the host can start the game');
    }
    
    const gameRef = doc(db, 'games', gameState.id);
    await setDoc(gameRef, { 
      status: 'playing',
      currentRound: 1,
      // We'll set the first question in a cloud function
    }, { merge: true });
  };

  // Submit an answer
  const submitAnswer = async (_answer: string): Promise<boolean> => {
    // This would typically call a cloud function to validate the answer
    // For now, we'll just return a placeholder
    return Promise.resolve(false);
  };

  // Use a bonus
  const useBonus = async (_bonusId: string, _targetPlayerId?: string): Promise<void> => {
    // This would typically call a cloud function to apply the bonus
    // For now, we'll just return a placeholder
    return Promise.resolve();
  };

  const value = {
    gameState,
    currentPlayer,
    isHost,
    createGame,
    joinGame,
    startGame,
    submitAnswer,
    useBonus
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// Create custom hook for using the context
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
