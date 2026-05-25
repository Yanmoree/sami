import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealGroup, revealItem } from '@/components/ui/Reveal';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n';

const EASE = [0.16, 1, 0.3, 1] as const;

export function AboutPage() {
  const t = useTranslation();
  const heroLines = t('about.heroTitle').split('\n');
  const principles = [
    { n: '01', title: t('about.p1Title'), body: t('about.p1Body') },
    { n: '02', title: t('about.p2Title'), body: t('about.p2Body') },
    { n: '03', title: t('about.p3Title'), body: t('about.p3Body') },
    { n: '04', title: t('about.p4Title'), body: t('about.p4Body') },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="border-b border-ink-200 overflow-hidden">
        <Container className="grid min-h-[70vh] items-center gap-12 py-20 md:grid-cols-2">
          <div className="space-y-6">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="label"
            >
              {t('about.label')}
            </motion.p>
            <h1 className="display text-display-2xl overflow-hidden">
              {heroLines.map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <motion.span
                    initial={{ y: '110%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.2 + i * 0.1 }}
                    className="block"
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
          </div>

          <Reveal className="flex items-center justify-center md:justify-end" delay={0.4} y={0}>
            <img
              src="/logo.png"
              alt="SAMI"
              className="w-full max-w-md h-auto"
            />
          </Reveal>
        </Container>
      </section>

      {/* STORY */}
      <section className="py-24">
        <Container className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <p className="label">{t('about.storyLabel')}</p>
          </Reveal>
          <Reveal className="md:col-span-8 space-y-6 max-w-2xl text-lg leading-relaxed text-ink-700" delay={0.1}>
            <p>{t('about.story1')}</p>
            <p>{t('about.story2')}</p>
            <p className="text-ink">{t('about.story3')}</p>
          </Reveal>
        </Container>
      </section>

      {/* PRINCIPLES */}
      <section className="border-y border-ink-200 bg-ink text-paper overflow-hidden">
        <Container className="py-24">
          <Reveal>
            <p className="label text-ink-300 mb-12">{t('about.principlesLabel')}</p>
          </Reveal>
          <RevealGroup className="grid gap-12 md:grid-cols-2" stagger={0.1}>
            {principles.map((p) => (
              <motion.div key={p.n} variants={revealItem} className="space-y-3">
                <p className="font-mono text-sm text-ink-400">{p.n}</p>
                <h3 className="display text-2xl">{p.title}</h3>
                <p className="text-ink-300 leading-relaxed max-w-md">{p.body}</p>
              </motion.div>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* IMAGE STRIP — используем lookbook фото */}
      <section className="py-24">
        <Container>
          <div className="grid grid-cols-12 gap-4">
            <Reveal as="div" className="col-span-12 md:col-span-8">
              <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
                <img
                  src="/lookbook/lookbook3.png"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out-expo hover:scale-105"
                />
              </div>
            </Reveal>
            <Reveal as="div" delay={0.1} className="col-span-12 md:col-span-4">
              <div className="relative aspect-[3/4] overflow-hidden bg-ink-100">
                <img
                  src="/lookbook/lookbook6.png"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out-expo hover:scale-105"
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <Container>
          <Reveal>
            <p className="display text-display-xl">{t('about.ctaTitle')}</p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/shop">
                <Button size="lg">{t('about.ctaPrimary')}</Button>
              </Link>
              <Link to="/shop">
                <Button size="lg" variant="outline">{t('about.ctaSecondary')}</Button>
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
