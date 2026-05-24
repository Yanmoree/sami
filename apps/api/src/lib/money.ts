/**
 * Цены в копейках (целые числа), чтобы избегать ошибок плавающей точки.
 * Все суммы между фронтом и БД ходят как minor units.
 */
export const toMinor = (rubles: number) => Math.round(rubles * 100);
export const toMajor = (minor: number) => minor / 100;
export const formatRub = (minor: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(
    toMajor(minor),
  );
