import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

interface Client {
  id: string;
  name: string;
  difficulty: number;
  points: number;
}

const ClientCounter: React.FC = () => {
  const { gameState, currentPlayer, acquireClient } = useGame();
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the player's current client
  const currentClient = currentPlayer?.currentClient as Client | undefined;
  
  // Calculate available clients count
  const availableClientsCount = gameState?.availableClients?.length || 0;
  
  const handleAcquireClient = async () => {
    if (!gameState || isAcquiring) return;
    
    setIsAcquiring(true);
    setError(null);
    
    try {
      await acquireClient();
    } catch (err) {
      console.error('Error acquiring client:', err);
      setError(err instanceof Error ? err.message : 'Failed to acquire client');
    } finally {
      setIsAcquiring(false);
    }
  };
  
  // Get difficulty stars based on client difficulty
  const getDifficultyStars = (difficulty: number) => {
    return '⭐'.repeat(difficulty);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">Pharmacy Clients</h3>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Available Clients:</span>
          <span className="font-medium">{availableClientsCount}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${(availableClientsCount / 6) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {currentClient ? (
        <div className="border border-gray-200 rounded-md p-3 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{currentClient.name}</h4>
              <div className="text-yellow-500 text-sm mt-1">
                {getDifficultyStars(currentClient.difficulty)}
              </div>
            </div>
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
              {currentClient.points} pts
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-3 mb-4 bg-gray-50 rounded-md text-gray-500 text-sm">
          No active client
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-3 text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={handleAcquireClient}
        disabled={isAcquiring || availableClientsCount === 0}
        className={`w-full py-2 px-4 rounded font-medium ${
          isAcquiring || availableClientsCount === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isAcquiring 
          ? 'Acquiring...' 
          : availableClientsCount === 0 
            ? 'No Clients Available' 
            : 'Acquire New Client'}
      </button>
    </div>
  );
};

export default ClientCounter;
