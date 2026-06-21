# SAMI

Минималистичный сайт бренда одежды **SAMI**. Монорепо: фронтенд на React + Vite, бэкенд на Fastify + Prisma + PostgreSQL.

> Эстетика: чёрно-белая, editorial-минимализм (в духе GRAILED, но чище). Display-шрифт — `Space Grotesk`, body — `Inter`.

---

## Структура

```
sami/
├── apps/
│   ├── web/   ← React + Vite + TypeScript + TailwindCSS (storefront)
│   └── api/   ← Fastify + Prisma + PostgreSQL (REST API)
├── docker-compose.yml  ← PostgreSQL для локальной разработки
└── package.json        ← npm workspaces
```

## Быстрый старт

Требования: **Node.js ≥ 20**, **Docker** (для PostgreSQL).

```bash
# 1. Установить зависимости (один раз)
npm install

# 2. Поднять PostgreSQL
npm run db:up

# 3. Скопировать env-файлы
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Применить миграции и засеять каталог
npm run db:migrate
npm run db:seed

# 5. Запустить фронт + бэк параллельно
npm run dev
```

После запуска:
- Фронт — http://localhost:5173
- API — http://localhost:4000
- Prisma Studio — `npm run db:studio` → http://localhost:5555

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | Запускает фронт и API параллельно |
| `npm run build` | Прод-сборка обоих приложений |
| `npm run db:up` / `db:down` | Поднять/опустить Postgres в Docker |
| `npm run db:migrate` | Применить миграции Prisma |
| `npm run db:seed` | Засеять стартовый каталог |
| `npm run db:studio` | GUI для просмотра БД |
| `npm run typecheck` | TS-проверка во всех воркспейсах |
| `npm run lint` | ESLint во всех воркспейсах |

## Логотип

Положи файл логотипа в `apps/web/public/logo.svg` (или `.png`). Заглушка-вордмарк уже встроена в `<Logo />` и срабатывает, если файла нет.

## Roadmap

- [x] MVP: каталог, товар, корзина, регистрация/логин, профиль
- [ ] Checkout с адресом и доставкой
- [ ] Интеграция ЮKassa (заготовка в `apps/api/src/modules/payments`)
- [ ] Админка (создание/редактирование товаров)
- [ ] Email-уведомления о заказах
- [ ] CDN для изображений товаров
- [ ] CI/CD + деплой (Vercel для фронта, Railway/Render для API)

## Бэкенд: контракт API

Все ответы JSON. Аутентификация — `Bearer` access-токен в заголовке, refresh — в httpOnly cookie.

| Метод | Путь | Назначение |
|---|---|---|
| POST | `/auth/register` | Регистрация |
| POST | `/auth/login` | Логин (выдаёт access + refresh cookie) |
| POST | `/auth/refresh` | Обновить access по refresh cookie |
| POST | `/auth/logout` | Логаут (отозвать refresh) |
| GET  | `/auth/me` | Текущий пользователь |
| GET  | `/products` | Список товаров (фильтры: `?category=`, `?q=`) |
| GET  | `/products/:slug` | Товар по slug |
| GET  | `/cart` | Текущая корзина |
| POST | `/cart/items` | Добавить позицию |
| PATCH | `/cart/items/:id` | Изменить количество/размер |
| DELETE | `/cart/items/:id` | Удалить позицию |
| POST | `/orders` | Оформить заказ из корзины |
| GET  | `/orders` | История заказов пользователя |
| GET  | `/orders/:id` | Детали заказа |
| POST | `/payments/yookassa/webhook` | Webhook от ЮKassa (заготовка) |

## Лицензия

Proprietary © SAMI
