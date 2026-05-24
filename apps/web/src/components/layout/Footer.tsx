import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { Reveal } from '@/components/ui/Reveal';

export function Footer() {
  return (
    <footer className="mt-32 border-t border-ink-200 bg-paper">
      <NewsletterStrip />

      <Container className="py-20">
        <Reveal>
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5 space-y-5">
              <Logo variant="mark" className="w-48 md:w-64 h-auto" />
              <p className="max-w-xs text-sm leading-relaxed text-ink-500">
                Минималистичная одежда. Сделано с акцентом на материалы, крой и долговечность.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <p className="label">Shop</p>
              <ul className="space-y-2 text-sm">
                <li><Link to="/shop/tees" className="text-ink-700 hover:text-ink">T-Shirts</Link></li>
                <li><Link to="/shop/hoodies" className="text-ink-700 hover:text-ink">Hoodies</Link></li>
                <li><Link to="/shop/outerwear" className="text-ink-700 hover:text-ink">Outerwear</Link></li>
                <li><Link to="/shop" className="text-ink-700 hover:text-ink">All</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <p className="label">Brand</p>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="text-ink-700 hover:text-ink">About</Link></li>
                <li><Link to="/account" className="text-ink-700 hover:text-ink">Account</Link></li>
                <li><Link to="/account/orders" className="text-ink-700 hover:text-ink">Orders</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <p className="label">Contact</p>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:hello@sami.shop" className="text-ink-700 hover:text-ink">hello@sami.shop</a></li>
                <li><a href="https://instagram.com" className="text-ink-700 hover:text-ink">Instagram</a></li>
                <li><a href="https://t.me/sami" className="text-ink-700 hover:text-ink">Telegram</a></li>
              </ul>
            </div>
          </div>
        </Reveal>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-6 text-xs text-ink-500">
          <p>© {new Date().getFullYear()} SAMI. All rights reserved.</p>
          <p className="uppercase tracking-[0.18em]">Made with care · Moscow</p>
        </div>
      </Container>
    </footer>
  );
}

function NewsletterStrip() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: подключить ESP (Mailgun/Sender/Brevo) — пока локальный fake-confirm
    setSubmitted(true);
  };

  return (
    <div className="border-b border-ink-200">
      <Container className="grid gap-10 py-20 md:grid-cols-2 md:items-end">
        <Reveal>
          <h2 className="display text-display-xl">
            Get on the
            <br />
            list.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="space-y-6">
            <p className="text-base text-ink-700 leading-relaxed max-w-md">
              Дропы, лукбуки и закрытые предзаказы — без шума. Только когда есть что показать.
            </p>
            {submitted ? (
              <p className="label text-ink">✓ Спасибо. Вы в списке.</p>
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
                  aria-label="Подписаться"
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
