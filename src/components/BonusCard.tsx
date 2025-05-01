import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

interface Bonus {
  id: string;
  name: string;
  effect: string;
  description: string;
}

interface BonusCardProps {
  bonus: Bonus;
}

const BonusCard: React.FC<BonusCardProps> = ({ bonus }) => {
  const { gameState, useBonus } = useGame();
  const [targetPlayerId, setTargetPlayerId] = useState<string>('');
  const [isUsing, setIsUsing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);
  
  // Check if the bonus requires a target player
  const requiresTarget = bonus.effect === 'steals_points';
  
  // Get other players for targeting
  const otherPlayers = gameState?.players.filter(p => p.id !== gameState.currentPlayer?.id) || [];
  
  const handleUseBonus = async () => {
    if (!gameState) return;
    
    setIsUsing(true);
    
    try {
      await useBonus(bonus.id, requiresTarget ? targetPlayerId : undefined);
      setResult({ success: true });
    } catch (error) {
      console.error('Error using bonus:', error);
      setResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsUsing(false);
    }
  };
  
  // Get the appropriate icon for the bonus effect
  const getEffectIcon = () => {
    switch (bonus.effect) {
      case 'doubles_points':
        return '×2';
      case 'extends_time':
        return '⏱️';
      case 'skips_question':
        return '⏭️';
      case 'steals_points':
        return '🔄';
      case 'provides_hint':
        return '💡';
      default:
        return '🎁';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 text-purple-700 font-bold">
          {getEffectIcon()}
        </div>
        <h3 className="text-lg font-semibold">{bonus.name}</h3>
      </div>
      
      <p className="text-gray-600 mb-3 text-sm">{bonus.description}</p>
      
      {requiresTarget && !result?.success && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Player
          </label>
          <select
            value={targetPlayerId}
            onChange={(e) => setTargetPlayerId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isUsing}
          >
            <option value="">Select a player</option>
            {otherPlayers.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.score || 0} pts)
              </option>
            ))}
          </select>
        </div>
      )}
      
      {result && (
        <div className={`p-3 mb-3 rounded-md text-sm ${
          result.success 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {result.success 
            ? 'Bonus used successfully!' 
            : `Failed to use bonus: ${result.message}`}
        </div>
      )}
      
      <button
        onClick={handleUseBonus}
        disabled={isUsing || (requiresTarget && !targetPlayerId) || result?.success}
        className={`w-full py-2 px-4 rounded font-medium ${
          isUsing || (requiresTarget && !targetPlayerId) || result?.success
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        {isUsing ? 'Using...' : result?.success ? 'Used' : 'Use Bonus'}
      </button>
    </div>
  );
};

export default BonusCard;
