import * as functions from "firebase-functions";

// Custom logger with structured logging
export const logger = {
  info: (message: string, data?: any) => {
    if (data) {
      functions.logger.info(message, data);
    } else {
      functions.logger.info(message);
    }
  },
  
  error: (message: string, error?: any) => {
    if (error instanceof Error) {
      functions.logger.error(message, { 
        error: error.message, 
        stack: error.stack 
      });
    } else if (error) {
      functions.logger.error(message, error);
    } else {
      functions.logger.error(message);
    }
  },
  
  warn: (message: string, data?: any) => {
    if (data) {
      functions.logger.warn(message, data);
    } else {
      functions.logger.warn(message);
    }
  },
  
  debug: (message: string, data?: any) => {
    if (data) {
      functions.logger.debug(message, data);
    } else {
      functions.logger.debug(message);
    }
  }
};
