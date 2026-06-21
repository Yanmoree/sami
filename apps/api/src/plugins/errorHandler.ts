import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

export default fp(async (app: FastifyInstance) => {
  app.setErrorHandler((error, req, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.flatten(),
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
    }

    // Fastify validation
    if (error.validation) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: error.message,
        details: error.validation,
      });
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      req.log.error({ err: error }, 'Unhandled error');
      return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      });
    }

    return reply.status(statusCode).send({
      error: error.code ?? 'ERROR',
      message: error.message,
    });
  });
});
