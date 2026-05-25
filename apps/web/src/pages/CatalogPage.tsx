import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productsApi } from '@/api/endpoints';
import { Container } from '@/components/ui/Container';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { RevealGroup, revealItem } from '@/components/ui/Reveal';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/cn';

const categoryKeys: Record<string, string> = {
  tees: 'nav.tees',
  hoodies: 'nav.hoodies',
  outerwear: 'nav.outerwear',
};

const categorySlugs = Object.keys(categoryKeys);

export function CatalogPage() {
  const t = useTranslation();
  const { category } = useParams<{ category?: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['products', { category }],
    queryFn: () => productsApi.list({ category, limit: 60 }),
  });

  const heading = category ? t(categoryKeys[category] ?? category) : t('catalog.all');

  return (
    <div>
      <Container className="py-12">
        <div className="mb-10 flex items-baseline justify-between gap-6 border-b border-ink-200 pb-6">
          <motion.h1
            key={heading}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="display text-display-lg"
          >
            {heading}
          </motion.h1>
          <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-[0.18em]">
            <Link to="/shop" className={cn(!category ? 'text-ink' : 'text-ink-500 hover:text-ink')}>
              {t('catalog.all')}
            </Link>
            {categorySlugs.map((slug) => (
              <Link
                key={slug}
                to={`/shop/${slug}`}
                className={cn(category === slug ? 'text-ink' : 'text-ink-500 hover:text-ink')}
              >
                {t(categoryKeys[slug]!)}
              </Link>
            ))}
          </nav>
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={4} />
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

        {data && data.items.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-ink-500">{t('catalog.empty')}</p>
          </div>
        )}
      </Container>
    </div>
  );
}
