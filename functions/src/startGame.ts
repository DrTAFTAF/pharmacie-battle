import * as admin from "firebase-admin";
import { logger } from "./logger";

const db = admin.firestore();

/**
 * Start a game with the given ID
 * @param {string} gameId - The ID of the game to start
 * @param {string} userId - The ID of the user starting the game (must be host)
 * @return {Promise<object>} - Game state after starting
 */
export const startGame = async (gameId: string, userId: string): Promise<object> => {
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
  
  // Check if the user is the host (first player)
  if (gameData.players.length === 0 || gameData.players[0].id !== userId) {
    throw new Error("Only the host can start the game");
  }
  
  // Check if the game is already started
  if (gameData.status !== "waiting") {
    throw new Error("Game has already started");
  }
  
  // Check if there are enough players
  if (gameData.players.length < 2) {
    throw new Error("At least 2 players are required to start the game");
  }
  
  try {
    // Get questions from Firestore
    const questionsSnap = await db.collection("questions").get();
    const questions = questionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (questions.length === 0) {
      // If no questions in Firestore, use the local questions
      const questionsData = require("./data/questions.json");
      
      // Upload questions to Firestore for future use
      const batch = db.batch();
      questionsData.forEach((question: any) => {
        const questionRef = db.collection("questions").doc(question.id);
        batch.set(questionRef, question);
      });
      await batch.commit();
      
      logger.info("Uploaded questions to Firestore", { count: questionsData.length });
    }
    
    // Get config from Firestore or use default
    let config;
    const configSnap = await db.collection("config").doc("game").get();
    
    if (!configSnap.exists) {
      // Use local config
      config = require("./data/config.json");
      
      // Upload config to Firestore for future use
      await db.collection("config").doc("game").set(config);
      
      logger.info("Uploaded config to Firestore");
    } else {
      config = configSnap.data();
    }
    
    // Shuffle and select questions for the game
    const shuffledQuestions = questions
      .sort(() => Math.random() - 0.5)
      .slice(0, config.totalRounds);
    
    // Update game state
    const updatedGameData = {
      status: "playing",
      currentRound: 1,
      questions: shuffledQuestions,
      currentQuestion: shuffledQuestions[0].id,
      startTime: admin.firestore.FieldValue.serverTimestamp(),
      roundStartTime: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await gameRef.update(updatedGameData);
    
    logger.info("Game started successfully", { gameId });
    
    return {
      success: true,
      gameState: {
        ...gameData,
        ...updatedGameData
      }
    };
  } catch (error) {
    logger.error("Error starting game", error);
    throw error;
  }
};
