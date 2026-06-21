import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { UnauthorizedError } from '../lib/errors.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: AccessTokenPayload;
  }
}

export default fp(async (app: FastifyInstance) => {
  await app.register(fastifyCookie, {
    secret: app.config.COOKIE_SECRET,
  });

  await app.register(fastifyJwt, {
    secret: app.config.JWT_ACCESS_SECRET,
    sign: { expiresIn: app.config.JWT_ACCESS_TTL },
  });

  app.decorate('authenticate', async (req: FastifyRequest, _reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  });

  app.decorate('optionalAuth', async (req: FastifyRequest) => {
    try {
      await req.jwtVerify();
    } catch {
      // ignore — anonymous request
    }
  });
});
