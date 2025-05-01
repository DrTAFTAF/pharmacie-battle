import React from 'react';

type Player = {
  id: string;
  name: string;
  score: number;
  bonuses: string[];
};

interface PlayerListProps {
  players: Player[];
}

const PlayerList: React.FC<PlayerListProps> = ({ players }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      {players.length === 0 ? (
        <p className="text-gray-500 text-center py-2">No players have joined yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {players.map((player) => (
            <li key={player.id} className="py-2 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-800 font-semibold">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{player.name}</span>
              </div>
              {player.score > 0 && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  {player.score} pts
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlayerList;
