export const formatRub = (minor: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(minor / 100);

export const formatNumber = (n: number) =>
  new Intl.NumberFormat('ru-RU').format(n);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
