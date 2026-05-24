import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product } from '@/api/types';
import { formatRub } from '@/lib/format';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const cover = product.images[0]?.url;
  const hover = product.images[1]?.url ?? cover;

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-ink-100">
        {cover && (
          <>
            <motion.img
              src={cover}
              alt={product.name}
              loading="lazy"
              initial={{ scale: 1.04, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out-expo group-hover:opacity-0 group-hover:scale-[1.03]"
            />
            <img
              src={hover}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 ease-out-expo group-hover:opacity-100 group-hover:scale-[1.03]"
            />
          </>
        )}

        {/* Появляющаяся подсказка при ховере */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 px-3 py-3 opacity-0 transition-all duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
          <span className="inline-block bg-paper px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-ink">
            Quick view →
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-medium tracking-tight text-ink">{product.name}</h3>
        <p className="font-mono text-sm text-ink-700">{formatRub(product.priceMinor)}</p>
      </div>
      {product.category && (
        <p className="mt-0.5 text-xs uppercase tracking-[0.15em] text-ink-500">{product.category.name}</p>
      )}
    </Link>
  );
}
