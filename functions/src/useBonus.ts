import * as admin from "firebase-admin";
import { logger } from "./logger";

const db = admin.firestore();

/**
 * Use a bonus in the game
 * @param {string} gameId - The ID of the game
 * @param {string} playerId - The ID of the player using the bonus
 * @param {string} bonusId - The ID of the bonus to use
 * @param {string} targetPlayerId - Optional target player ID for certain bonuses
 * @return {Promise<object>} - Result of using the bonus
 */
export const useBonus = async (
  gameId: string,
  playerId: string,
  bonusId: string,
  targetPlayerId?: string
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
  
  // Check if the player has the bonus
  const player = gameData.players[playerIndex];
  if (!player.bonuses || !player.bonuses.includes(bonusId)) {
    throw new Error("Player does not have this bonus");
  }
  
  try {
    // Get the bonus details
    let bonusData;
    const bonusSnap = await db.collection("bonuses").doc(bonusId).get();
    
    if (!bonusSnap.exists) {
      // Use local bonus data if not in Firestore
      const bonusesData = require("./data/bonuses.json");
      bonusData = bonusesData.find((b: any) => b.id === bonusId);
      
      if (!bonusData) {
        throw new Error("Bonus not found");
      }
      
      // Upload bonuses to Firestore for future use
      const batch = db.batch();
      bonusesData.forEach((bonus: any) => {
        const bonusRef = db.collection("bonuses").doc(bonus.id);
        batch.set(bonusRef, bonus);
      });
      await batch.commit();
      
      logger.info("Uploaded bonuses to Firestore", { count: bonusesData.length });
    } else {
      bonusData = bonusSnap.data();
    }
    
    // Remove the bonus from the player
    const updatedBonuses = player.bonuses.filter((b: string) => b !== bonusId);
    
    // Apply the bonus effect based on its type
    switch (bonusData.effect) {
      case "doubles_points":
        // Set active bonus for the player
        await gameRef.update({
          [`players.${playerIndex}.bonuses`]: updatedBonuses,
          [`players.${playerIndex}.activeBonus`]: "doubles_points"
        });
        break;
        
      case "extends_time":
        // Add time to the current round
        await gameRef.update({
          [`players.${playerIndex}.bonuses`]: updatedBonuses,
          roundEndTime: admin.firestore.FieldValue.serverTimestamp() + 15000 // Add 15 seconds
        });
        break;
        
      case "skips_question":
        // Move to the next question
        const currentRound = gameData.currentRound;
        const nextRound = currentRound + 1;
        
        if (nextRound > gameData.questions.length) {
          // End the game if this was the last question
          await gameRef.update({
            [`players.${playerIndex}.bonuses`]: updatedBonuses,
            status: "finished",
            endTime: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Move to the next question
          await gameRef.update({
            [`players.${playerIndex}.bonuses`]: updatedBonuses,
            currentRound: nextRound,
            currentQuestion: gameData.questions[nextRound - 1].id,
            roundStartTime: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        break;
        
      case "steals_points":
        // Check if target player ID is provided
        if (!targetPlayerId) {
          throw new Error("Target player ID is required for this bonus");
        }
        
        // Check if target player is in the game
        const targetPlayerIndex = gameData.players.findIndex((p: any) => p.id === targetPlayerId);
        if (targetPlayerIndex === -1) {
          throw new Error("Target player is not in this game");
        }
        
        // Steal points from target player
        const targetPlayer = gameData.players[targetPlayerIndex];
        const pointsToSteal = Math.min(targetPlayer.score || 0, 5);
        
        if (pointsToSteal <= 0) {
          throw new Error("Target player has no points to steal");
        }
        
        const updatedPlayers = [...gameData.players];
        updatedPlayers[targetPlayerIndex].score = (targetPlayer.score || 0) - pointsToSteal;
        updatedPlayers[playerIndex].score = (player.score || 0) + pointsToSteal;
        updatedPlayers[playerIndex].bonuses = updatedBonuses;
        
        await gameRef.update({
          players: updatedPlayers
        });
        break;
        
      case "provides_hint":
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
        
        // Generate a hint (e.g., first letter of the answer)
        const hint = `The answer starts with "${question.answer.charAt(0)}"`;
        
        await gameRef.update({
          [`players.${playerIndex}.bonuses`]: updatedBonuses,
          [`hints.${currentQuestionId}`]: hint
        });
        break;
        
      default:
        throw new Error("Unknown bonus effect");
    }
    
    logger.info("Bonus used", { 
      gameId, 
      playerId, 
      bonusId,
      effect: bonusData.effect,
      targetPlayerId 
    });
    
    return {
      success: true,
      effect: bonusData.effect
    };
  } catch (error) {
    logger.error("Error using bonus", error);
    throw error;
  }
};
