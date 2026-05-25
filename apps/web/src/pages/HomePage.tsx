import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productsApi } from '@/api/endpoints';
import { Container } from '@/components/ui/Container';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealGroup, revealItem } from '@/components/ui/Reveal';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/i18n';

const EASE = [0.16, 1, 0.3, 1] as const;

export function HomePage() {
  const t = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['products', { home: true }],
    queryFn: () => productsApi.list({ limit: 8 }),
  });

  const heroLines = t('home.heroTitle').split('\n');

  return (
    <div>
      {/* HERO */}
      <section className="relative border-b border-ink-200 overflow-hidden">
        <Container className="grid min-h-[80vh] grid-cols-1 items-center gap-12 py-16 md:grid-cols-2">
          <div className="space-y-8">
            <motion.p
              className="label"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            >
              {t('home.season')}
            </motion.p>

            {/* Stagger of heading lines */}
            <h1 className="display text-display-2xl text-ink overflow-hidden">
              {heroLines.map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <motion.span
                    initial={{ y: '110%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.3 + i * 0.12 }}
                    className="block"
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              className="max-w-md text-base leading-relaxed text-ink-700"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.85 }}
            >
              {t('home.heroLead')}
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 1.0 }}
            >
              <Link to="/shop">
                <Button size="lg">{t('home.ctaShop')}</Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline">{t('home.ctaAbout')}</Button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="relative w-full mx-auto overflow-hidden bg-ink-100 aspect-[4/5] max-h-[480px] md:max-h-[560px]"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: EASE, delay: 0.1 }}
          >
            <img
              src="/head1.png"
              alt="SAMI editorial"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </motion.div>
        </Container>
      </section>

      {/* FEATURED GRID */}
      <section className="py-24">
        <Container>
          <Reveal>
            <div className="mb-12 flex items-end justify-between">
              <h2 className="display text-display-lg">{t('home.newArrivals')}</h2>
              <Link to="/shop" className="label hover:text-ink transition-colors">
                {t('home.viewAll')} →
              </Link>
            </div>
          </Reveal>

          {isLoading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <RevealGroup
              className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4"
              stagger={0.08}
            >
              {data?.items.map((p) => (
                <motion.div key={p.id} variants={revealItem}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </RevealGroup>
          )}
        </Container>
      </section>

      {/* MANIFESTO */}
      <section className="border-y border-ink-200 bg-ink text-paper overflow-hidden">
        <Container className="py-32">
          <Reveal>
            <div className="mx-auto max-w-3xl space-y-8 text-center">
              <p className="label text-ink-300">{t('home.manifestoTitle')}</p>
              <p className="display text-display-xl whitespace-pre-line">{t('home.manifestoHeading')}</p>
              <p className="mx-auto max-w-xl text-base leading-relaxed text-ink-300">
                {t('home.manifestoBody')}
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* LOOKBOOK / EDITORIAL — все 7 фото */}
      <section className="py-24">
        <Container>
          <Reveal>
            <div className="mb-12 flex items-end justify-between">
              <h2 className="display text-display-lg">{t('home.lookbookTitle')}</h2>
              <p className="label">SS · 01</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-12 gap-4">
            <Reveal as="div" className="col-span-12 md:col-span-7">
              <LookbookImage src="/lookbook/lookbook1.png" ratio="aspect-[4/5]" />
            </Reveal>
            <Reveal as="div" delay={0.1} className="col-span-12 md:col-span-5 space-y-4">
              <LookbookImage src="/lookbook/lookbook2.png" ratio="aspect-[4/5]" />
              <p className="text-sm leading-relaxed text-ink-600">
                {t('home.lookbookCaption')}
              </p>
            </Reveal>

            <Reveal as="div" delay={0.2} className="col-span-6 md:col-span-4">
              <LookbookImage src="/lookbook/lookbook3.png" ratio="aspect-square" />
            </Reveal>
            <Reveal as="div" delay={0.25} className="col-span-6 md:col-span-4">
              <LookbookImage src="/lookbook/lookbook4.png" ratio="aspect-square" />
            </Reveal>
            <Reveal as="div" delay={0.3} className="col-span-12 md:col-span-4">
              <LookbookImage src="/lookbook/lookbook5.png" ratio="aspect-square" />
            </Reveal>

            <Reveal as="div" delay={0.35} className="col-span-12 md:col-span-6">
              <LookbookImage src="/lookbook/lookbook6.png" ratio="aspect-[4/5]" />
            </Reveal>
            <Reveal as="div" delay={0.4} className="col-span-12 md:col-span-6">
              <LookbookImage src="/lookbook/lookbook7.png" ratio="aspect-[4/5]" />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* CTA / BIG WORDMARK */}
      <section className="border-t border-ink-200 overflow-hidden">
        <Container className="py-24 text-center">
          <Reveal>
            <p className="label mb-6">{t('home.dropAvailable')}</p>
            <h2 className="display text-display-2xl leading-[0.9]">
              SAMI
              <span className="text-ink-300">.</span>
            </h2>
            <div className="mt-10 flex justify-center">
              <Link to="/shop">
                <Button size="lg">{t('home.ctaShop')} →</Button>
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}

function LookbookImage({ src, ratio }: { src: string; ratio: string }) {
  return (
    <div className={`relative ${ratio} overflow-hidden bg-ink-100`}>
      <img
        src={src}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out-expo hover:scale-105"
      />
    </div>
  );
}
