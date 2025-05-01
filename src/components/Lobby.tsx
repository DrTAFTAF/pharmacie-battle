import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
// Import the PlayerList component directly from the same directory
import PlayerList from './PlayerList';

const Lobby: React.FC = () => {
  const { gameState, isHost, startGame } = useGame();
  const [copied, setCopied] = useState(false);

  const copyGameId = () => {
    if (gameState) {
      navigator.clipboard.writeText(gameState.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame();
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  if (!gameState) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Game Lobby</h2>
      
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <span className="font-semibold mr-2">Game ID:</span>
          <span className="font-mono bg-gray-100 px-2 py-1 rounded">{gameState.id}</span>
          <button 
            onClick={copyGameId}
            className="ml-2 text-blue-500 hover:text-blue-700"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Share this code with other players to join your game.
        </p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Players</h3>
        <PlayerList players={gameState.players} />
        <p className="text-sm text-gray-600 mt-2">
          {gameState.players.length} / 8 players joined
        </p>
      </div>
      
      {isHost && (
        <div className="mt-6">
          <button
            onClick={handleStartGame}
            disabled={gameState.players.length < 2}
            className={`w-full py-2 px-4 rounded font-semibold ${
              gameState.players.length < 2
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Start Game
          </button>
          {gameState.players.length < 2 && (
            <p className="text-sm text-red-500 mt-2">
              At least 2 players are required to start the game.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Lobby;
