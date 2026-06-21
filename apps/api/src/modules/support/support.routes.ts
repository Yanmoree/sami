import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NotFoundError } from '../../lib/errors.js';
import { classify, faqAnswerKey, type FaqTag } from '../../lib/faq-bot.js';

const sendSchema = z.object({
  body: z.string().min(1).max(2000),
  /** Если true — пользователь сразу зовёт оператора, бот молчит */
  askOperator: z.boolean().optional(),
});

/**
 * Все эндпоинты возвращают i18n-ключи бот-сообщений вместо локализованного текста —
 * фронт рендерит их через свой словарь, в нужном языке.
 */
export default async function supportRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // Получить или создать активный чат пользователя + последние сообщения
  app.get('/conversation', async (req) => {
    const userId = req.user!.sub;
    let conv = await app.prisma.conversation.findFirst({
      where: { userId, status: { not: 'CLOSED' } },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (!conv) {
      conv = await app.prisma.conversation.create({
        data: {
          userId,
          status: 'BOT',
          messages: {
            create: {
              sender: 'BOT',
              body: 'support.welcome',
              faqTag: null,
            },
          },
        },
      });
    }

    const messages = await app.prisma.message.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: 'asc' },
    });

    // Сбросим unread для пользователя — он сейчас в чате
    if (conv.unreadForUser > 0) {
      await app.prisma.conversation.update({
        where: { id: conv.id },
        data: { unreadForUser: 0 },
      });
    }

    return { conversation: conv, messages };
  });

  // Отправить сообщение
  app.post('/messages', async (req) => {
    const { body, askOperator } = sendSchema.parse(req.body);
    const userId = req.user!.sub;

    let conv = await app.prisma.conversation.findFirst({
      where: { userId, status: { not: 'CLOSED' } },
      orderBy: { lastMessageAt: 'desc' },
    });
    if (!conv) {
      conv = await app.prisma.conversation.create({
        data: { userId, status: 'BOT' },
      });
    }

    // User message
    const userMsg = await app.prisma.message.create({
      data: { conversationId: conv.id, sender: 'USER', body },
    });

    const newMessages = [userMsg];

    // Если просят оператора — переводим в WAITING, бот молчит
    if (askOperator) {
      const sysMsg = await app.prisma.message.create({
        data: {
          conversationId: conv.id,
          sender: 'SYSTEM',
          body: 'support.operatorRequested',
        },
      });
      newMessages.push(sysMsg);
      await app.prisma.conversation.update({
        where: { id: conv.id },
        data: {
          status: 'WAITING',
          unreadForAdmin: { increment: 1 },
          lastMessageAt: new Date(),
        },
      });
      return { conversation: { ...conv, status: 'WAITING' }, messages: newMessages };
    }

    // Если уже подключился оператор — бот молчит, ждём оператора
    if (conv.status === 'OPERATOR' || conv.status === 'WAITING') {
      await app.prisma.conversation.update({
        where: { id: conv.id },
        data: {
          unreadForAdmin: { increment: 1 },
          lastMessageAt: new Date(),
        },
      });
      return { conversation: conv, messages: newMessages };
    }

    // Иначе — бот отвечает
    const tag: FaqTag = classify(body);
    const botMsg = await app.prisma.message.create({
      data: {
        conversationId: conv.id,
        sender: 'BOT',
        body: faqAnswerKey(tag),
        faqTag: tag,
      },
    });
    newMessages.push(botMsg);

    const updated = await app.prisma.conversation.update({
      where: { id: conv.id },
      data: {
        topicTag: tag === 'unknown' ? conv.topicTag : tag,
        lastMessageAt: new Date(),
        unreadForAdmin: tag === 'unknown' ? { increment: 1 } : conv.unreadForAdmin,
      },
    });

    return { conversation: updated, messages: newMessages };
  });
}
