import React from 'react';
import { useGame } from '../context/GameContext';

interface LeaderboardProps {
  showDetails?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ showDetails = false }) => {
  const { gameState, currentPlayer } = useGame();
  
  if (!gameState) return <div>Loading...</div>;
  
  // Sort players by score in descending order
  const sortedPlayers = [...gameState.players].sort((a, b) => 
    (b.score || 0) - (a.score || 0)
  );
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">Leaderboard</h3>
      
      {sortedPlayers.length === 0 ? (
        <p className="text-gray-500 text-center py-2">No players yet.</p>
      ) : (
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const isCurrentPlayer = player.id === currentPlayer?.id;
            
            return (
              <div 
                key={player.id}
                className={`flex items-center p-2 rounded-md ${
                  isCurrentPlayer ? 'bg-blue-50' : (index % 2 === 0 ? 'bg-gray-50' : '')
                }`}
              >
                <div className="w-8 text-center font-semibold text-gray-500">
                  {index + 1}
                </div>
                
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-800 font-semibold">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1">
                  <span className={`font-medium ${isCurrentPlayer ? 'text-blue-700' : ''}`}>
                    {player.name}
                    {isCurrentPlayer && <span className="ml-1 text-xs">(You)</span>}
                  </span>
                  
                  {showDetails && (
                    <div className="text-xs text-gray-500 mt-1">
                      {player.bonuses?.length ? (
                        <span className="mr-3">🎁 {player.bonuses.length} bonus(es)</span>
                      ) : null}
                      
                      {player.currentClient ? (
                        <span>👤 Has client</span>
                      ) : null}
                    </div>
                  )}
                </div>
                
                <div className="font-semibold">
                  {player.score || 0} pts
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {gameState.status === 'finished' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-center mb-2">Game Results</h4>
          
          {sortedPlayers.length > 0 && (
            <div className="text-center">
              <div className="text-lg font-bold text-blue-700">
                {sortedPlayers[0].name}
              </div>
              <div className="text-sm text-gray-600">
                Winner with {sortedPlayers[0].score || 0} points
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
