import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import PlayerInput from './PlayerInput';

interface QuizCardProps {
  questionId: string;
  timeLimit: number;
}

const QuizCard: React.FC<QuizCardProps> = ({ questionId, timeLimit }) => {
  const { gameState, submitAnswer } = useGame();
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<{isCorrect?: boolean; points?: number; correctAnswer?: string} | null>(null);
  
  // Find the current question from the game state
  const question = gameState?.questions?.find(q => q.id === questionId);
  
  // Timer effect
  useEffect(() => {
    if (!answered && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [timeLeft, answered]);
  
  // Handle answer submission
  const handleSubmit = async (answer: string) => {
    if (answered) return;
    
    try {
      const response = await submitAnswer(answer);
      setResult(response);
      setAnswered(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!question) return <div>Loading question...</div>;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-gray-500">
          Question {gameState?.currentRound} of {gameState?.questions?.length || '?'}
        </span>
        <span className={`font-mono text-lg ${timeLeft < 10 ? 'text-red-500' : 'text-gray-700'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">{question.text}</h3>
        <div className="text-sm text-gray-500">
          Worth {question.points} points
        </div>
      </div>
      
      {gameState?.hints?.[questionId] && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <p className="text-blue-700">
            <span className="font-semibold">Hint:</span> {gameState.hints[questionId]}
          </p>
        </div>
      )}
      
      {result ? (
        <div className={`p-4 mb-4 rounded-md ${result.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p className="font-medium">
            {result.isCorrect 
              ? `Correct! You earned ${result.points} points.` 
              : `Incorrect. The correct answer is: ${result.correctAnswer}`}
          </p>
        </div>
      ) : (
        <PlayerInput 
          onSubmit={handleSubmit} 
          disabled={timeLeft === 0 || answered} 
        />
      )}
      
      {timeLeft === 0 && !answered && (
        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-md">
          <p>Time's up! The correct answer was: {question.answer}</p>
        </div>
      )}
    </div>
  );
};

export default QuizCard;
