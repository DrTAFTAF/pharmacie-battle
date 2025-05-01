import * as functions from 'firebase-functions';
import { db } from './index';
import { logger } from './logger';

/**
 * Cloud Function to end a game and update the leaderboard
 * This function is triggered when a game is completed
 * It calculates final scores and updates the scores collection
 */
export const endGame = functions.https.onCall(async (data, context) => {
  try {
    const { gameId } = data;
    
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    // Ensure the user is authenticated
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    logger.info(`Ending game ${gameId}`, { gameId, userId: context.auth.uid });

    // Get the game data
    const gameRef = db.collection('games').doc(gameId);
    const gameDoc = await gameRef.get();
    
    if (!gameDoc.exists) {
      throw new Error(`Game ${gameId} not found`);
    }
    
    const gameData = gameDoc.data();
    
    if (!gameData) {
      throw new Error(`Game ${gameId} data is empty`);
    }

    // Get all players in the game
    const playersSnapshot = await gameRef.collection('players').get();
    const players = playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate final scores and rankings
    const rankedPlayers = players
      .sort((a, b) => {
        // Sort by score (descending)
        if (b.score !== a.score) return b.score - a.score;
        
        // If scores are tied, sort by clients (descending)
        if (b.clients !== a.clients) return b.clients - a.clients;
        
        // If clients are tied, sort by correct answers (descending)
        return b.correctAnswers - a.correctAnswers;
      })
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));

    // Create a game summary
    const gameSummary = {
      gameId,
      startedAt: gameData.startedAt,
      endedAt: new Date(),
      players: rankedPlayers,
      totalQuestions: gameData.questions ? gameData.questions.length : 0,
      winner: rankedPlayers.length > 0 ? rankedPlayers[0] : null
    };

    // Save the game summary to the scores collection
    await db.collection('scores').doc(gameId).set(gameSummary);

    // Update the game status to completed
    await gameRef.update({
      status: 'completed',
      endedAt: new Date()
    });

    logger.info(`Game ${gameId} ended successfully`, { 
      gameId, 
      userId: context.auth.uid,
      playerCount: players.length,
      winner: rankedPlayers.length > 0 ? rankedPlayers[0].id : null
    });

    return {
      success: true,
      gameId,
      leaderboard: rankedPlayers
    };
  } catch (error) {
    logger.error('Error ending game', { 
      error: error instanceof Error ? error.message : String(error),
      gameId: data.gameId,
      userId: context.auth?.uid
    });
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to end game',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
});
