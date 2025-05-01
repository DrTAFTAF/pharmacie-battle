import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../api/firebase';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';

// Define types
type Client = {
  id: string;
  name: string;
  difficulty: number;
  points: number;
};

type Question = {
  id: string;
  text: string;
  answer: string;
  points: number;
};

type Player = {
  id: string;
  name: string;
  score: number;
  bonuses: string[];
  currentClient?: Client;
  activeBonus?: string;
};

type GameState = {
  id: string;
  status: 'waiting' | 'playing' | 'finished';
  currentRound: number;
  currentQuestion: string | null;
  players: Player[];
  questions?: Question[];
  availableClients?: Client[];
  hints?: Record<string, string>;
  answers?: Record<string, Record<string, any>>;
  startTime?: any;
  endTime?: any;
  roundStartTime?: any;
  roundEndTime?: any;
  currentPlayer?: Player | null;
};

type GameContextType = {
  gameState: GameState | null;
  currentPlayer: Player | null;
  isHost: boolean;
  createGame: () => Promise<string>;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  startGame: () => Promise<void>;
  submitAnswer: (answer: string) => Promise<{isCorrect: boolean; points?: number; correctAnswer?: string}>;
  useBonus: (bonusId: string, targetPlayerId?: string) => Promise<{success: boolean; effect?: string}>;
  acquireClient: () => Promise<{success: boolean; client?: Client}>;
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
  const submitAnswer = async (answer: string): Promise<{isCorrect: boolean; points?: number; correctAnswer?: string}> => {
    if (!gameState || !auth.currentUser) {
      throw new Error('Game not active or user not authenticated');
    }
    
    try {
      // In a real implementation, this would call a Firebase Cloud Function
      // For now, we'll simulate the response
      const currentQuestion = gameState.questions?.find(q => q.id === gameState.currentQuestion);
      
      if (!currentQuestion) {
        throw new Error('No active question');
      }
      
      const isCorrect = answer.toLowerCase() === currentQuestion.answer.toLowerCase();
      let points = 0;
      
      if (isCorrect) {
        points = currentQuestion.points;
        
        // Check if player has active bonus
        if (currentPlayer?.activeBonus === 'doubles_points') {
          points *= 2;
        }
        
        // Update local player score (in a real app, this would be done by the cloud function)
        if (currentPlayer) {
          const updatedPlayers = gameState.players.map(p => {
            if (p.id === currentPlayer.id) {
              return { ...p, score: (p.score || 0) + points };
            }
            return p;
          });
          
          // This is just for the demo - in a real app, the cloud function would update Firestore
          setGameState(prev => prev ? { ...prev, players: updatedPlayers } : null);
        }
      }
      
      return {
        isCorrect,
        points: isCorrect ? points : 0,
        correctAnswer: isCorrect ? undefined : currentQuestion.answer
      };
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  };

  // Use a bonus
  const useBonus = async (bonusId: string, targetPlayerId?: string): Promise<{success: boolean; effect?: string}> => {
    if (!gameState || !auth.currentUser || !currentPlayer) {
      throw new Error('Game not active or user not authenticated');
    }
    
    // Check if player has the bonus
    if (!currentPlayer.bonuses || !currentPlayer.bonuses.includes(bonusId)) {
      throw new Error('You do not have this bonus');
    }
    
    try {
      // In a real implementation, this would call a Firebase Cloud Function
      // For now, we'll simulate the response
      
      // Get the bonus details
      const bonusesData = await import('../data/bonuses.json');
      const bonus = bonusesData.default.find((b: any) => b.id === bonusId);
      
      if (!bonus) {
        throw new Error('Bonus not found');
      }
      
      // Check if target player is required
      if (bonus.effect === 'steals_points' && !targetPlayerId) {
        throw new Error('Target player is required for this bonus');
      }
      
      // Remove the bonus from the player
      const updatedBonuses = currentPlayer.bonuses.filter(b => b !== bonusId);
      
      // Update the player's bonuses (in a real app, this would be done by the cloud function)
      const updatedPlayers = gameState.players.map(p => {
        if (p.id === currentPlayer.id) {
          return { ...p, bonuses: updatedBonuses, activeBonus: bonus.effect === 'doubles_points' ? 'doubles_points' : p.activeBonus };
        }
        return p;
      });
      
      // This is just for the demo - in a real app, the cloud function would update Firestore
      setGameState(prev => prev ? { ...prev, players: updatedPlayers } : null);
      
      return {
        success: true,
        effect: bonus.effect
      };
    } catch (error) {
      console.error('Error using bonus:', error);
      throw error;
    }
  };
  
  // Acquire a client
  const acquireClient = async (): Promise<{success: boolean; client?: Client}> => {
    if (!gameState || !auth.currentUser || !currentPlayer) {
      throw new Error('Game not active or user not authenticated');
    }
    
    try {
      // In a real implementation, this would call a Firebase Cloud Function
      // For now, we'll simulate the response
      
      // Check if clients are available
      if (!gameState.availableClients || gameState.availableClients.length === 0) {
        // Generate new clients if none are available
        const clients = [
          { id: "c1", name: "Elderly patient with hypertension", difficulty: 1, points: 10 },
          { id: "c2", name: "Child with fever", difficulty: 1, points: 10 },
          { id: "c3", name: "Adult with allergies", difficulty: 1, points: 10 },
          { id: "c4", name: "Patient with diabetes", difficulty: 2, points: 15 },
          { id: "c5", name: "Pregnant woman", difficulty: 2, points: 15 },
          { id: "c6", name: "Patient with multiple medications", difficulty: 3, points: 20 }
        ];
        
        // Shuffle clients
        const shuffledClients = [...clients].sort(() => Math.random() - 0.5);
        
        // Update game with available clients
        setGameState(prev => prev ? { ...prev, availableClients: shuffledClients } : null);
        
        return await acquireClient(); // Try again now that we have clients
      }
      
      // Get a random client
      const clientIndex = Math.floor(Math.random() * gameState.availableClients.length);
      const client = gameState.availableClients[clientIndex];
      
      // Remove the client from available clients
      const newAvailableClients = [...gameState.availableClients];
      newAvailableClients.splice(clientIndex, 1);
      
      // Update the player with the new client
      const updatedPlayers = gameState.players.map(p => {
        if (p.id === currentPlayer.id) {
          return { ...p, currentClient: client };
        }
        return p;
      });
      
      // This is just for the demo - in a real app, the cloud function would update Firestore
      setGameState(prev => prev ? { 
        ...prev, 
        availableClients: newAvailableClients,
        players: updatedPlayers 
      } : null);
      
      return {
        success: true,
        client
      };
    } catch (error) {
      console.error('Error acquiring client:', error);
      throw error;
    }
  };

  const value = {
    gameState,
    currentPlayer,
    isHost,
    createGame,
    joinGame,
    startGame,
    submitAnswer,
    useBonus,
    acquireClient
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
