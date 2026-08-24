import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { env, type Env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: Env;
  }
}

export default fp(async (app: FastifyInstance) => {
  app.decorate('config', env);
});
