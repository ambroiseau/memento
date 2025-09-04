import cors from '@fastify/cors';
import Fastify from 'fastify';
import { config } from './config.js';
import { renderHandler } from './handlers/render.js';

const fastify = Fastify({
  logger: true,
});

// Register CORS
await fastify.register(cors, {
  origin: [
    'https://memento-ruddy.vercel.app',
    'https://memento.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// CORS test endpoint
fastify.get('/cors-test', async (request, reply) => {
  return {
    status: 'cors-ok',
    timestamp: new Date().toISOString(),
    origin: request.headers.origin,
  };
});

// PDF generation endpoint
fastify.post('/render', renderHandler);

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`PDF renderer service listening on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
