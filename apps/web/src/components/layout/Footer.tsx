import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { useTranslation } from '@/i18n';

export function Footer() {
  const t = useTranslation();
  return (
    <footer className="mt-32 border-t border-ink-200 bg-paper">
      <NewsletterStrip />

      <Container className="py-20">
        <Reveal>
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5 space-y-5">
              <img src="/logo.png" alt="SAMI" className="h-20 w-auto md:h-28" />
              <p className="max-w-xs text-sm leading-relaxed text-ink-500">{t('footer.lead')}</p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <p className="label">{t('footer.shop')}</p>
              <ul className="space-y-2 text-sm">
                <li><Link to="/shop/tees" className="text-ink-700 hover:text-ink">{t('nav.tees')}</Link></li>
                <li><Link to="/shop" className="text-ink-700 hover:text-ink">{t('catalog.all')}</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <p className="label">{t('footer.brand')}</p>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="text-ink-700 hover:text-ink">{t('footer.about')}</Link></li>
                <li><Link to="/account" className="text-ink-700 hover:text-ink">{t('footer.account')}</Link></li>
                <li><Link to="/account/orders" className="text-ink-700 hover:text-ink">{t('footer.orders')}</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <p className="label">{t('footer.contact')}</p>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:hello@sami.shop" className="text-ink-700 hover:text-ink">hello@sami.shop</a></li>
                <li><a href="https://instagram.com" className="text-ink-700 hover:text-ink">Instagram</a></li>
                <li><a href="https://t.me/sami" className="text-ink-700 hover:text-ink">Telegram</a></li>
              </ul>
            </div>
          </div>
        </Reveal>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-6 text-xs text-ink-500">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <p className="uppercase tracking-[0.18em]">{t('footer.madeIn')}</p>
        </div>
      </Container>
    </footer>
  );
}

function NewsletterStrip() {
  const t = useTranslation();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="border-b border-ink-200">
      <Container className="grid gap-10 py-20 md:grid-cols-2 md:items-end">
        <Reveal>
          <h2 className="display text-display-xl whitespace-pre-line">{t('newsletter.title')}</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="space-y-6">
            <p className="text-base text-ink-700 leading-relaxed max-w-md">{t('newsletter.body')}</p>
            {submitted ? (
              <p className="label text-ink">{t('newsletter.ok')}</p>
            ) : (
              <form onSubmit={onSubmit} className="flex items-center border-b border-ink">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full bg-transparent text-base text-ink placeholder:text-ink-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex h-12 items-center justify-center px-3 text-ink hover:text-ink-600 transition-colors"
                  aria-label={t('newsletter.subscribe')}
                >
                  <ArrowRight size={18} strokeWidth={1.5} />
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
