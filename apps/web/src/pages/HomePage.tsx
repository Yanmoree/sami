import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productsApi } from '@/api/endpoints';
import { Container } from '@/components/ui/Container';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealGroup, revealItem } from '@/components/ui/Reveal';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { Logo } from '@/components/ui/Logo';

const EASE = [0.16, 1, 0.3, 1] as const;

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products', { home: true }],
    queryFn: () => productsApi.list({ limit: 8 }),
  });

  return (
    <div>
      {/* HERO */}
      <section className="relative border-b border-ink-200 overflow-hidden">
        <Container className="grid min-h-[80vh] grid-cols-1 items-end gap-12 py-16 md:grid-cols-2">
          <div className="space-y-8">
            <motion.p
              className="label"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            >
              Spring / Summer · 01
            </motion.p>

            {/* Stagger of heading lines */}
            <h1 className="display text-display-2xl text-ink overflow-hidden">
              {['Базовое,', 'сделанное', 'иначе.'].map((line, i) => (
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
              SAMI — минималистичная одежда на каждый день. Плотные ткани, выверенные пропорции, никакого лишнего.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 1.0 }}
            >
              <Link to="/shop">
                <Button size="lg">Shop the collection</Button>
              </Link>
              <Link to="/shop/hoodies">
                <Button size="lg" variant="outline">Hoodies</Button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="relative aspect-[4/5] w-full overflow-hidden bg-ink-100"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: EASE, delay: 0.1 }}
          >
            <img
              src="https://picsum.photos/seed/sami-hero/1200/1500"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </motion.div>
        </Container>

        {/* Декоративный SAMICZO mark в углу */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.07 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="pointer-events-none absolute -bottom-16 -left-20 hidden md:block"
        >
          <Logo variant="mark" className="w-[28rem] h-auto" />
        </motion.div>
      </section>

      {/* FEATURED GRID */}
      <section className="py-24">
        <Container>
          <Reveal>
            <div className="mb-12 flex items-end justify-between">
              <h2 className="display text-display-lg">New arrivals</h2>
              <Link to="/shop" className="label hover:text-ink transition-colors">
                View all →
              </Link>
            </div>
          </Reveal>

          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <RevealGroup
              className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4"
              stagger={0.06}
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
              <p className="label text-ink-300">Manifesto</p>
              <p className="display text-display-xl">
                Меньше шума.
                <br />
                Больше материала.
              </p>
              <p className="mx-auto max-w-xl text-base leading-relaxed text-ink-300">
                Мы делаем вещи, которые служат долго: плотный хлопок 240 г/м², усиленные швы,
                кропотливая посадка. Каждая модель проходит несколько итераций до того, как попасть к
                вам.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* LOOKBOOK / EDITORIAL */}
      <section className="py-24">
        <Container>
          <Reveal>
            <div className="mb-12 flex items-end justify-between">
              <h2 className="display text-display-lg">Lookbook</h2>
              <p className="label">SS · 01</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-12 gap-4">
            <Reveal as="div" className="col-span-12 md:col-span-7">
              <div className="relative aspect-[4/5] overflow-hidden bg-ink-100">
                <img src="https://picsum.photos/seed/sami-look-1/1400/1750" alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out-expo hover:scale-105" />
              </div>
            </Reveal>
            <Reveal as="div" delay={0.1} className="col-span-12 md:col-span-5 space-y-4">
              <div className="relative aspect-[4/5] overflow-hidden bg-ink-100">
                <img src="https://picsum.photos/seed/sami-look-2/900/1125" alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out-expo hover:scale-105" />
              </div>
              <p className="text-sm leading-relaxed text-ink-600">
                Editorial-минимализм. Чёрно-белая палитра, фактура и тишина — ничего, что отвлекает от вещи.
              </p>
            </Reveal>
            <Reveal as="div" delay={0.2} className="col-span-6 md:col-span-4">
              <div className="relative aspect-square overflow-hidden bg-ink-100">
                <img src="https://picsum.photos/seed/sami-look-3/900/900" alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out-expo hover:scale-105" />
              </div>
            </Reveal>
            <Reveal as="div" delay={0.25} className="col-span-6 md:col-span-4">
              <div className="relative aspect-square overflow-hidden bg-ink-100">
                <img src="https://picsum.photos/seed/sami-look-4/900/900" alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out-expo hover:scale-105" />
              </div>
            </Reveal>
            <Reveal as="div" delay={0.3} className="col-span-12 md:col-span-4">
              <div className="relative aspect-square overflow-hidden bg-ink-100">
                <img src="https://picsum.photos/seed/sami-look-5/900/900" alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out-expo hover:scale-105" />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* CTA / BIG WORDMARK */}
      <section className="border-t border-ink-200 overflow-hidden">
        <Container className="py-24 text-center">
          <Reveal>
            <p className="label mb-6">SS·01 · Now Available</p>
            <h2 className="display text-display-2xl leading-[0.9]">
              SAMI
              <span className="text-ink-300">.</span>
            </h2>
            <div className="mt-10 flex justify-center">
              <Link to="/shop">
                <Button size="lg">Shop now →</Button>
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
