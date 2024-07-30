// Import Third-party Dependencies
import pino from 'pino';

export const logger = pino({
  level: 'error', 
  transport: {
    target: 'pino-pretty', 
    options: {
      colorize: true, 
      translateTime: true, 
      ignore: 'pid,hostname', 
    },
  },
});
