import * as admin from "firebase-admin";
import { logger } from "./logger";

const db = admin.firestore();

/**
 * Process a player's answer to the current question
 * @param {string} gameId - The ID of the game
 * @param {string} playerId - The ID of the player answering
 * @param {string} answer - The player's answer
 * @return {Promise<object>} - Result of the answer submission
 */
export const answerQuestion = async (
  gameId: string, 
  playerId: string, 
  answer: string
): Promise<object> => {
  const gameRef = db.collection("games").doc(gameId);
  
  // Get the current game state
  const gameSnap = await gameRef.get();
  
  if (!gameSnap.exists) {
    throw new Error("Game not found");
  }
  
  const gameData = gameSnap.data();
  
  if (!gameData) {
    throw new Error("Game data is empty");
  }
  
  // Check if the game is in progress
  if (gameData.status !== "playing") {
    throw new Error("Game is not in progress");
  }
  
  // Check if the player is in the game
  const playerIndex = gameData.players.findIndex((p: any) => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error("Player is not in this game");
  }
  
  // Get the current question
  const currentQuestionId = gameData.currentQuestion;
  if (!currentQuestionId) {
    throw new Error("No active question");
  }
  
  // Find the question in the game questions
  const question = gameData.questions.find((q: any) => q.id === currentQuestionId);
  if (!question) {
    throw new Error("Question not found");
  }
  
  try {
    // Check if the player has already answered this question
    if (gameData.answers && gameData.answers[currentQuestionId] && 
        gameData.answers[currentQuestionId][playerId]) {
      return {
        success: false,
        message: "You have already answered this question"
      };
    }
    
    // Check if the answer is correct (case-insensitive comparison)
    const isCorrect = answer.toLowerCase() === question.answer.toLowerCase();
    
    // Calculate points
    let points = 0;
    if (isCorrect) {
      // Base points for the question
      points = question.points || 10;
      
      // Check if player has a double points bonus active
      const player = gameData.players[playerIndex];
      const hasDoublePointsBonus = player.activeBonus === "doubles_points";
      
      if (hasDoublePointsBonus) {
        points *= 2;
        
        // Remove the used bonus
        await gameRef.update({
          [`players.${playerIndex}.activeBonus`]: admin.firestore.FieldValue.delete()
        });
      }
    }
    
    // Update player's score
    const updatedPlayers = [...gameData.players];
    updatedPlayers[playerIndex].score = (updatedPlayers[playerIndex].score || 0) + points;
    
    // Record the answer
    const answerData = {
      playerId,
      answer,
      isCorrect,
      points,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Update game state with the answer
    await gameRef.update({
      players: updatedPlayers,
      [`answers.${currentQuestionId}.${playerId}`]: answerData
    });
    
    logger.info("Answer processed", { 
      gameId, 
      playerId, 
      questionId: currentQuestionId,
      isCorrect,
      points 
    });
    
    return {
      success: true,
      isCorrect,
      points,
      correctAnswer: isCorrect ? undefined : question.answer
    };
  } catch (error) {
    logger.error("Error processing answer", error);
    throw error;
  }
};
