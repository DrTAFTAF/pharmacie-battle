import React, { useState } from 'react';

interface PlayerInputProps {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

const PlayerInput: React.FC<PlayerInputProps> = ({ onSubmit, disabled = false }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim() && !disabled) {
      onSubmit(answer.trim());
      setAnswer('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={disabled}
          placeholder="Type your answer..."
          className={`flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'
          }`}
        />
        <button
          type="submit"
          disabled={disabled || !answer.trim()}
          className={`px-4 py-2 rounded-r-lg font-medium ${
            disabled || !answer.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default PlayerInput;
