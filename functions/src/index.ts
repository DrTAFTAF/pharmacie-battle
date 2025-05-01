import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { startGame } from "./startGame";
import { answerQuestion } from "./answerQuestion";
import { acquireClient } from "./acquireClient";
import { useBonus } from "./useBonus";
import { endGame } from "./endGame";
import { logger } from "./logger";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export Firestore for use in other modules
export const db = admin.firestore();

// Export Cloud Functions
export const startGameFunction = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to start a game."
      );
    }

    const { gameId } = data;
    if (!gameId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Game ID is required."
      );
    }

    return await startGame(gameId, context.auth.uid);
  } catch (error) {
    logger.error("Error starting game:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while starting the game."
    );
  }
});

export const answerQuestionFunction = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to answer a question."
      );
    }

    const { gameId, answer } = data;
    if (!gameId || !answer) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Game ID and answer are required."
      );
    }

    return await answerQuestion(gameId, context.auth.uid, answer);
  } catch (error) {
    logger.error("Error answering question:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while processing your answer."
    );
  }
});

export const acquireClientFunction = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to acquire a client."
      );
    }

    const { gameId } = data;
    if (!gameId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Game ID is required."
      );
    }

    return await acquireClient(gameId, context.auth.uid);
  } catch (error) {
    logger.error("Error acquiring client:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while acquiring a client."
    );
  }
});

export const useBonusFunction = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to use a bonus."
      );
    }

    const { gameId, bonusId, targetPlayerId } = data;
    if (!gameId || !bonusId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Game ID and bonus ID are required."
      );
    }

    return await useBonus(gameId, context.auth.uid, bonusId, targetPlayerId);
  } catch (error) {
    logger.error("Error using bonus:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while using the bonus."
    );
  }
});

export const endGameFunction = endGame;
