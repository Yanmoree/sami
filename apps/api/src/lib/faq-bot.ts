/**
 * Простой keyword-based классификатор обращений в поддержку.
 * По первому сообщению пытается угадать тему и подбирает ответ.
 * Если уверенности < threshold — отдаёт UNKNOWN.
 */

export type FaqTag =
  | 'delivery'
  | 'return'
  | 'size'
  | 'payment'
  | 'order'
  | 'stock'
  | 'unknown';

interface FaqRule {
  tag: FaqTag;
  weight: number;            // вес тега
  keywords: RegExp[];        // совпадающие паттерны (case-insensitive)
}

const RULES: FaqRule[] = [
  {
    tag: 'delivery',
    weight: 1.0,
    keywords: [
      /\bдоставк/i, /\bпривез/i, /\bпрешл[её]т/i, /\bкогда\s+(будет|приедет|придет)/i,
      /\bсрок/i, /\bтранспортн/i, /\bпочт/i, /\bкурьер/i,
      /\bdeliver/i, /\bshipp?ing/i, /\bwhen.*arrive/i, /\beta\b/i,
    ],
  },
  {
    tag: 'return',
    weight: 1.0,
    keywords: [
      /\bвозврат/i, /\bобмен/i, /\bотказ\s+от/i, /\bвернуть/i, /\bне\s+подош[еёл]л/i,
      /\bre(turn|fund)/i, /\bexchange/i,
    ],
  },
  {
    tag: 'size',
    weight: 1.0,
    keywords: [
      /\bразмер/i, /\bподобрать/i, /\bбольшеват/i, /\bмаловат/i, /\bсетк[аи]\s+размер/i,
      /\bsize/i, /\bfit\b/i, /\btoo (small|big|large)/i, /\bmeasur/i,
    ],
  },
  {
    tag: 'payment',
    weight: 1.0,
    keywords: [
      /\bоплат/i, /\bплат[её]ж/i, /\bкарт[аы]/i, /\bсбп\b/i, /\bне\s+проходит\s+оплата/i,
      /\bpay(ment)?/i, /\bcard\b/i, /\binvoice/i,
    ],
  },
  {
    tag: 'order',
    weight: 0.9,
    keywords: [
      /\bзаказ[\s,.!?№#]/i, /\bстатус/i, /\bномер\s+заказ/i, /\bs-\d{4,}/i,
      /\border\b/i, /\bstatus\b/i,
    ],
  },
  {
    tag: 'stock',
    weight: 0.9,
    keywords: [
      /\bналичи/i, /\bесть\s+в\s+наличии/i, /\bраспрод/i, /\bкогда\s+будет\s+в/i, /\bпополн/i,
      /\bin\s*stock/i, /\brestock/i, /\bsold\s*out/i,
    ],
  },
];

/**
 * Классифицируем текст. Возвращаем самый «тяжёлый» тег.
 * Если ни одно правило не сработало — UNKNOWN.
 */
export function classify(text: string): FaqTag {
  if (!text || text.trim().length < 2) return 'unknown';

  const scores = new Map<FaqTag, number>();
  for (const rule of RULES) {
    let hits = 0;
    for (const kw of rule.keywords) {
      if (kw.test(text)) hits += 1;
    }
    if (hits === 0) continue;
    scores.set(rule.tag, (scores.get(rule.tag) ?? 0) + hits * rule.weight);
  }

  if (scores.size === 0) return 'unknown';

  const top = [...scores.entries()].sort((a, b) => b[1] - a[1])[0]!;
  // минимальный порог — отсекаем слишком слабые совпадения
  return top[1] >= 0.8 ? top[0] : 'unknown';
}

/**
 * Возвращает i18n-ключ ответа на FAQ-категорию.
 * Текст ответов — на фронте (используем выбранный пользователем язык).
 */
export function faqAnswerKey(tag: FaqTag): string {
  switch (tag) {
    case 'delivery': return 'support.faqDelivery';
    case 'return': return 'support.faqReturn';
    case 'size': return 'support.faqSize';
    case 'payment': return 'support.faqPayment';
    case 'order': return 'support.faqOrder';
    case 'stock': return 'support.faqStock';
    default: return 'support.faqUnknown';
  }
}
