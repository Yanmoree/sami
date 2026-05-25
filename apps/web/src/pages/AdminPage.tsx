import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminApi, productsApi } from '@/api/endpoints';
import type { AdminProductInput } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth';
import { formatRub } from '@/lib/format';
import { useTranslation } from '@/i18n';
import { IS_DEMO } from '@/lib/demo';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '@/api/types';

export function AdminPage() {
  const t = useTranslation();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', { admin: true }],
    queryFn: () => productsApi.list({ limit: 100 }).then((r) => r.items),
    enabled: isAdmin,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => adminApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: AdminProductInput }) =>
      id ? adminApi.update(id, input) : adminApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setEditing(null);
    },
  });

  if (!isAdmin) {
    return (
      <Container className="py-32 text-center">
        <h1 className="display text-display-lg mb-4">{t('admin.title')}</h1>
        <p className="text-ink-500">{t('admin.accessDenied')}</p>
      </Container>
    );
  }

  return (
    <div>
      <Container className="py-12 space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-200 pb-6">
          <div>
            <p className="label">{t('admin.title')}</p>
            <h1 className="display text-display-lg mt-1">{t('admin.products')}</h1>
          </div>
          <Button onClick={() => setEditing('new')}>
            <Plus size={16} strokeWidth={1.5} className="mr-2" />
            {t('admin.addProduct')}
          </Button>
        </div>

        {IS_DEMO && (
          <div className="border border-ink-200 bg-ink-50 p-4 text-xs leading-relaxed text-ink-600">
            {t('admin.demoNotice')}
          </div>
        )}

        {isLoading && <p className="text-sm text-ink-500">{t('common.loading')}</p>}

        {products && (
          <div className="border-y border-ink-200">
            <ul className="divide-y divide-ink-200">
              {products.map((p) => {
                const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                const isCustom = p.id.startsWith('custom-');
                return (
                  <li key={p.id} className="flex items-center gap-6 py-4">
                    <div className="aspect-square w-16 flex-shrink-0 overflow-hidden bg-ink-100">
                      {p.images[0] && (
                        <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {p.slug} · {p.variants.length} {t('common.size').toLowerCase()} · stock {totalStock}
                      </p>
                    </div>
                    <p className="font-mono text-sm">{formatRub(p.priceMinor)}</p>
                    {isCustom ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(p)}
                          className="p-2 text-ink-500 hover:text-ink transition-colors"
                          aria-label={t('common.edit')}
                        >
                          <Pencil size={16} strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Удалить «${p.name}»?`)) removeMutation.mutate(p.id);
                          }}
                          className="p-2 text-ink-500 hover:text-red-600 transition-colors"
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] uppercase tracking-[0.18em] text-ink-400">built-in</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Container>

      <AnimatePresence>
        {editing && (
          <ProductFormDrawer
            mode={editing === 'new' ? 'new' : 'edit'}
            initial={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSubmit={(input) =>
              upsertMutation.mutate({
                id: editing === 'new' ? undefined : editing.id,
                input,
              })
            }
            isLoading={upsertMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ProductFormDrawerProps {
  mode: 'new' | 'edit';
  initial: Product | null;
  onClose: () => void;
  onSubmit: (input: AdminProductInput) => void;
  isLoading: boolean;
}

interface FormShape {
  slug: string;
  name: string;
  description: string;
  priceRub: number;
  imagesText: string;
  sizesText: string;
  stock: number;
}

function ProductFormDrawer({ mode, initial, onClose, onSubmit, isLoading }: ProductFormDrawerProps) {
  const t = useTranslation();
  const { register, handleSubmit } = useForm<FormShape>({
    defaultValues: initial
      ? {
          slug: initial.slug,
          name: initial.name,
          description: initial.description,
          priceRub: initial.priceMinor / 100,
          imagesText: initial.images.map((i) => i.url).join('\n'),
          sizesText: initial.variants.map((v) => v.size).join(', '),
          stock: initial.variants[0]?.stock ?? 25,
        }
      : {
          slug: '',
          name: '',
          description: '',
          priceRub: 3200,
          imagesText: '/products/black1.png',
          sizesText: 'S, M, L, XL',
          stock: 25,
        },
  });

  const submit = handleSubmit((data) => {
    const images = data.imagesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const sizes = data.sizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onSubmit({
      slug: data.slug,
      name: data.name,
      description: data.description,
      priceRub: Number(data.priceRub),
      images,
      sizes,
      stock: Number(data.stock),
    });
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="flex-1 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t('common.cancel')}
      />
      <motion.aside
        className="w-full max-w-xl bg-paper overflow-y-auto"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <form onSubmit={submit} className="space-y-8 p-8">
          <header className="flex items-center justify-between border-b border-ink-200 pb-4">
            <h2 className="display text-2xl">
              {mode === 'new' ? t('admin.newProduct') : t('admin.editProduct')}
            </h2>
            <button type="button" onClick={onClose} className="text-ink-500 hover:text-ink">
              ✕
            </button>
          </header>

          <Input label={t('admin.slug')} placeholder="my-product" {...register('slug', { required: true })} />
          <Input label={t('admin.name')} placeholder="CORE TEE / BLACK" {...register('name', { required: true })} />

          <div className="flex flex-col gap-1.5">
            <label className="label">{t('admin.description')}</label>
            <textarea
              className="min-h-[100px] w-full border-b border-ink-300 bg-transparent py-2 text-base text-ink placeholder:text-ink-400 focus:outline-none focus:border-ink"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Input
              label={t('admin.priceRub')}
              type="number"
              step="1"
              {...register('priceRub', { required: true, valueAsNumber: true })}
            />
            <Input
              label={t('admin.stock')}
              type="number"
              step="1"
              {...register('stock', { required: true, valueAsNumber: true })}
            />
          </div>

          <Input
            label={t('admin.sizes')}
            placeholder="S, M, L, XL"
            {...register('sizesText', { required: true })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="label">{t('admin.imagesUrls')}</label>
            <textarea
              className="min-h-[120px] w-full border-b border-ink-300 bg-transparent py-2 font-mono text-sm text-ink placeholder:text-ink-400 focus:outline-none focus:border-ink"
              placeholder={'/products/black1.png\n/products/black2.png'}
              {...register('imagesText', { required: true })}
            />
          </div>

          <div className="flex items-center gap-3 border-t border-ink-200 pt-6">
            <Button type="submit" isLoading={isLoading}>
              {t('common.save')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </motion.aside>
    </motion.div>
  );
}
