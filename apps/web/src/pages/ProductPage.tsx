import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { productsApi } from '@/api/endpoints';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { formatRub } from '@/lib/format';
import { useAuthStore } from '@/store/auth';
import { useAddToCart } from '@/hooks/useCart';
import { ProductPageSkeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { cn } from '@/lib/cn';

const EASE = [0.16, 1, 0.3, 1] as const;

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const addToCart = useAddToCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.bySlug(slug!),
    enabled: Boolean(slug),
  });

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading || !product) {
    return <ProductPageSkeleton />;
  }

  const variant = product.variants.find((v) => v.id === selectedVariantId);
  const price = variant?.priceMinor ?? product.priceMinor;
  const currentImage = product.images[activeImage];

  const handleAdd = async () => {
    if (!accessToken) {
      navigate('/login', { state: { from: `/product/${slug}` } });
      return;
    }
    if (!variant) return;
    await addToCart.mutateAsync({
      productId: product.id,
      variantId: variant.id,
    });
    navigate('/cart');
  };

  return (
    <div>
      <Container className="grid gap-12 py-12 md:grid-cols-[1.4fr,1fr]">
        {/* GALLERY */}
        <div className="space-y-3">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-ink-100">
            <AnimatePresence mode="wait">
              {currentImage && (
                <motion.img
                  key={currentImage.id}
                  src={currentImage.url}
                  alt={currentImage.alt ?? product.name}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: EASE }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </AnimatePresence>
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'aspect-[3/4] overflow-hidden bg-ink-100 transition-opacity',
                    i === activeImage ? 'opacity-100 outline outline-1 outline-ink' : 'opacity-60 hover:opacity-100',
                  )}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <Reveal className="space-y-8 md:sticky md:top-32 md:self-start" amount={0.05}>
          <div className="space-y-2">
            {product.category && <p className="label">{product.category.name}</p>}
            <h1 className="display text-display-lg leading-none">{product.name}</h1>
            <p className="font-mono text-lg text-ink">{formatRub(price)}</p>
          </div>

          <p className="text-base leading-relaxed text-ink-700">{product.description}</p>

          {/* Size selector */}
          <div className="space-y-3">
            <p className="label">Размер</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const out = v.stock <= 0;
                const active = v.id === selectedVariantId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={out}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={cn(
                      'min-w-[3rem] border px-4 py-2 text-sm transition-all duration-200',
                      active
                        ? 'border-ink bg-ink text-paper scale-[1.02]'
                        : 'border-ink-300 text-ink hover:border-ink',
                      out && 'cursor-not-allowed opacity-40 line-through',
                    )}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            size="lg"
            fullWidth
            disabled={!variant}
            isLoading={addToCart.isPending}
            onClick={handleAdd}
          >
            {variant ? 'Добавить в корзину' : 'Выберите размер'}
          </Button>

          <div className="hairline pt-6 text-sm text-ink-600 space-y-1.5">
            <p>· Доставка по РФ — 3–7 рабочих дней</p>
            <p>· Возврат в течение 14 дней</p>
            <p>· Материал: 100% хлопок, 240 г/м²</p>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
