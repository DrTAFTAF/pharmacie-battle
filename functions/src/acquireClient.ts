import * as admin from "firebase-admin";
import { logger } from "./logger";

const db = admin.firestore();

/**
 * Acquire a client in the pharmacy battle game
 * @param {string} gameId - The ID of the game
 * @param {string} playerId - The ID of the player
 * @return {Promise<object>} - Result of the client acquisition
 */
export const acquireClient = async (
  gameId: string,
  playerId: string
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
  
  try {
    // Check if clients are available
    if (!gameData.availableClients || gameData.availableClients.length === 0) {
      // Generate new clients if none are available
      const clients = [
        { id: "c1", name: "Elderly patient with hypertension", difficulty: 1, points: 10 },
        { id: "c2", name: "Child with fever", difficulty: 1, points: 10 },
        { id: "c3", name: "Adult with allergies", difficulty: 1, points: 10 },
        { id: "c4", name: "Patient with diabetes", difficulty: 2, points: 15 },
        { id: "c5", name: "Pregnant woman", difficulty: 2, points: 15 },
        { id: "c6", name: "Patient with multiple medications", difficulty: 3, points: 20 }
      ];
      
      // Shuffle clients
      const shuffledClients = clients.sort(() => Math.random() - 0.5);
      
      // Update game with available clients
      await gameRef.update({
        availableClients: shuffledClients
      });
      
      logger.info("Generated new clients", { gameId, count: shuffledClients.length });
    }
    
    // Get updated game data
    const updatedGameSnap = await gameRef.get();
    const updatedGameData = updatedGameSnap.data();
    
    if (!updatedGameData || !updatedGameData.availableClients || updatedGameData.availableClients.length === 0) {
      throw new Error("No clients available");
    }
    
    // Get a random client
    const clientIndex = Math.floor(Math.random() * updatedGameData.availableClients.length);
    const client = updatedGameData.availableClients[clientIndex];
    
    // Remove the client from available clients
    const newAvailableClients = [...updatedGameData.availableClients];
    newAvailableClients.splice(clientIndex, 1);
    
    // Assign the client to the player
    await gameRef.update({
      availableClients: newAvailableClients,
      [`players.${playerIndex}.currentClient`]: client
    });
    
    logger.info("Client acquired", { gameId, playerId, clientId: client.id });
    
    return {
      success: true,
      client
    };
  } catch (error) {
    logger.error("Error acquiring client", error);
    throw error;
  }
};
