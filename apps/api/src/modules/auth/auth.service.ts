import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { ConflictError, UnauthorizedError } from '../../lib/errors.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';

const REFRESH_COOKIE = 'sami_refresh';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshTtlMs(ttl: string): number {
  // Поддержка форматов "30d", "12h", "60m"
  const m = ttl.match(/^(\d+)([smhd])$/);
  if (!m) return 30 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const unit = m[2];
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return n * mult;
}

export class AuthService {
  constructor(private readonly app: FastifyInstance) {}

  async register(input: RegisterInput) {
    const existing = await this.app.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('Пользователь с таким email уже зарегистрирован');

    const passwordHash = await hashPassword(input.password);
    const user = await this.app.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        cart: { create: {} },
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
    });
    return user;
  }

  async login(input: LoginInput) {
    const user = await this.app.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new UnauthorizedError('Неверный email или пароль');

    const ok = await verifyPassword(user.passwordHash, input.password);
    if (!ok) throw new UnauthorizedError('Неверный email или пароль');

    return user;
  }

  async issueTokens(user: { id: string; email: string }) {
    const accessToken = this.app.jwt.sign({ sub: user.id, email: user.email });

    const refreshTokenRaw = crypto.randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + refreshTtlMs(this.app.config.JWT_REFRESH_TTL));
    await this.app.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshTokenRaw),
        expiresAt,
      },
    });
    return { accessToken, refreshToken: refreshTokenRaw, refreshExpiresAt: expiresAt };
  }

  async rotateRefresh(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const record = await this.app.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token invalid');
    }
    await this.app.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens({ id: record.user.id, email: record.user.email });
  }

  async revokeRefresh(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    await this.app.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  cookieName = REFRESH_COOKIE;

  cookieOptions(expiresAt?: Date) {
    const isProd = this.app.config.NODE_ENV === 'production';
    return {
      path: '/',
      httpOnly: true,
      // В проде фронт и API на разных доменах (Vercel ↔ Render) — cookie должна
      // отправляться cross-site, поэтому SameSite=None + Secure обязательны.
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      secure: isProd,
      signed: true,
      expires: expiresAt,
    };
  }
}
