// Import Third-party Dependencies
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info', // Default to 'info' if not set
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z', // More readable timestamp format
      ignore: 'pid,hostname',
    },
  },
});
