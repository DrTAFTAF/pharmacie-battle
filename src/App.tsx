import { useState } from 'react'
import { GameProvider, useGame } from './context/GameContext'
import Lobby from './components/Lobby'
import PlayerInput from './components/PlayerInput'
import './styles/tailwind.css'

const GameScreen = () => {
  const { gameState, submitAnswer } = useGame();
  
  if (!gameState) return <div>Loading...</div>;
  
  if (gameState.status === 'waiting') {
    return <Lobby />;
  }
  
  // Placeholder for the actual game screen
  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Game in Progress</h2>
      <p>Round: {gameState.currentRound}</p>
      <p className="mt-4 mb-6 p-4 bg-blue-100 rounded-lg">
        {gameState.currentQuestion || 'Loading question...'}
      </p>
      <PlayerInput onSubmit={submitAnswer} />
    </div>
  );
};

const HomeScreen = () => {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joining, setJoining] = useState(false);
  const { createGame, joinGame } = useGame();

  const handleCreateGame = async () => {
    try {
      if (!playerName.trim()) {
        alert('Please enter your name');
        return;
      }
      await createGame();
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const handleJoinGame = async () => {
    try {
      if (!gameId.trim() || !playerName.trim()) {
        alert('Please enter both game ID and your name');
        return;
      }
      await joinGame(gameId.trim(), playerName.trim());
    } catch (error) {
      console.error('Failed to join game:', error);
      alert(`Failed to join game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-3xl font-bold text-center mb-6">Pharmacie Battle</h1>
      
      <div className="mb-4">
        <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">
          Your Name
        </label>
        <input
          type="text"
          id="playerName"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your name"
        />
      </div>
      
      {joining ? (
        <>
          <div className="mb-4">
            <label htmlFor="gameId" className="block text-sm font-medium text-gray-700 mb-1">
              Game ID
            </label>
            <input
              type="text"
              id="gameId"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter game ID"
            />
          </div>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleJoinGame}
              className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Join Game
            </button>
            <button
              onClick={() => setJoining(false)}
              className="w-full py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Back
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleCreateGame}
            className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create New Game
          </button>
          <button
            onClick={() => setJoining(true)}
            className="w-full py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Join Existing Game
          </button>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-gray-100 py-12">
        <AppContent />
      </div>
    </GameProvider>
  )
}

const AppContent = () => {
  const { gameState } = useGame();
  const inGame = gameState !== null;
  
  return inGame ? <GameScreen /> : <HomeScreen />;
}

export default App
