import type { FastifyInstance } from 'fastify';
import { AuthService } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import { UnauthorizedError } from '../../lib/errors.js';

export default async function authRoutes(app: FastifyInstance) {
  const service = new AuthService(app);

  app.post('/register', async (req, reply) => {
    const input = registerSchema.parse(req.body);
    const user = await service.register(input);
    const tokens = await service.issueTokens({ id: user.id, email: user.email });
    reply.setCookie(service.cookieName, tokens.refreshToken, service.cookieOptions(tokens.refreshExpiresAt));
    return reply.status(201).send({ user, accessToken: tokens.accessToken });
  });

  app.post('/login', async (req, reply) => {
    const input = loginSchema.parse(req.body);
    const user = await service.login(input);
    const tokens = await service.issueTokens({ id: user.id, email: user.email });
    reply.setCookie(service.cookieName, tokens.refreshToken, service.cookieOptions(tokens.refreshExpiresAt));
    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken: tokens.accessToken,
    });
  });

  app.post('/refresh', async (req, reply) => {
    const signed = req.cookies[service.cookieName];
    if (!signed) throw new UnauthorizedError('Refresh cookie missing');
    const unsigned = req.unsignCookie(signed);
    if (!unsigned.valid || !unsigned.value) throw new UnauthorizedError('Invalid refresh cookie');

    const tokens = await service.rotateRefresh(unsigned.value);
    reply.setCookie(service.cookieName, tokens.refreshToken, service.cookieOptions(tokens.refreshExpiresAt));
    return reply.send({ accessToken: tokens.accessToken });
  });

  app.post('/logout', async (req, reply) => {
    const signed = req.cookies[service.cookieName];
    if (signed) {
      const unsigned = req.unsignCookie(signed);
      if (unsigned.valid && unsigned.value) {
        await service.revokeRefresh(unsigned.value);
      }
    }
    reply.clearCookie(service.cookieName, { path: '/' });
    return reply.status(204).send();
  });

  app.get(
    '/me',
    { onRequest: [app.authenticate] },
    async (req) => {
      const user = await app.prisma.user.findUnique({
        where: { id: req.user!.sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });
      if (!user) throw new UnauthorizedError();
      return { user };
    },
  );
}
