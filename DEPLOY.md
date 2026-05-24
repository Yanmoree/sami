# Deploy SAMI

Стек:
- **Фронт** → [Vercel](https://vercel.com) (бесплатно, global CDN)
- **API** → [Render](https://render.com) Web Service (бесплатно, sleeps after 15 min idle)
- **БД** → [Neon](https://neon.tech) Serverless PostgreSQL (бесплатно, 0.5 GB)

В среднем весь процесс занимает 15-20 минут.

---

## 0. Подготовить репозиторий

```bash
cd ~/Desktop/sami

# Если ещё не сделано — авторизоваться в GitHub CLI:
gh auth login
# выбери: GitHub.com → HTTPS → авторизоваться через браузер

# Создать репозиторий и запушить
gh repo create sami --public --source=. --remote=origin --push
```

Если используешь приватный — поменяй `--public` на `--private`. Render и Vercel оба умеют работать с приватными репо после OAuth-подключения.

---

## 1. Neon — поднять PostgreSQL

1. Открой <https://console.neon.tech/signup>, войди через GitHub.
2. Создай проект:
   - Name: `sami`
   - Region: **Frankfurt** (ближе к Render-региону, который мы выбрали)
   - Postgres version: 16
3. На странице проекта скопируй **Connection string** (вкладка _Dashboard → Connection Details_).
   Должен выглядеть так:
   ```
   postgresql://USER:PASSWORD@ep-xxxxx.eu-central-1.aws.neon.tech/sami?sslmode=require
   ```
   **Важно:** `sslmode=require` обязательно — Neon без TLS не работает.
4. Сохрани эту строку — понадобится в Render.

---

## 2. Render — задеплоить API

1. Открой <https://dashboard.render.com>, войди через GitHub.
2. _New +_ → _Blueprint_.
3. Выбери репо `Yanmoree/sami`. Render найдёт `render.yaml` и предложит создать сервис `sami-api`.
4. Заполни поля _sync: false_:
   - `DATABASE_URL` — Neon connection string из шага 1
   - `CORS_ORIGIN` — пока поставь `*` (поправим после деплоя фронта)
5. Нажми **Apply**. Render начнёт сборку:
   - install → generate Prisma → migrate deploy → seed (6 товаров) → tsc build → start
6. После «Live» в логах должно быть `Server listening on http://0.0.0.0:10000`.
7. Скопируй публичный URL — будет вида `https://sami-api.onrender.com`.
8. Проверь в браузере: `https://sami-api.onrender.com/health` → `{"status":"ok",...}`

---

## 3. Vercel — задеплоить фронт

1. Открой <https://vercel.com/new>, войди через GitHub.
2. _Import Git Repository_ → выбери `Yanmoree/sami`.
3. **Configure Project:**
   - **Framework Preset:** `Other`
   - **Root Directory:** оставь корень (`.`)
   - **Build & Output:** Vercel подхватит `vercel.json` автоматически
4. _Environment Variables:_
   - `VITE_API_BASE_URL` = `https://sami-api.onrender.com` (URL из шага 2)
5. Нажми **Deploy**. Билд ~ 1-2 мин.
6. После деплоя получишь URL вида `https://sami-xxxx.vercel.app`.

---

## 4. Связать фронт и API (CORS)

Вернись в Render → твой сервис `sami-api` → _Environment_ → отредактируй:
- `CORS_ORIGIN` = `https://sami-xxxx.vercel.app` (твой реальный Vercel-URL)

Render автоматически перезапустит сервис. Через 30-60 секунд фронт сможет ходить в API.

---

## 5. Готово

Открывай ссылку с Vercel — сайт работает.

- 6 товаров засеяны
- Регистрация/логин работают
- Корзина, оформление заказа — работают
- ЮKassa — заглушка (см. `apps/api/src/modules/payments/payments.routes.ts`)

---

## Ограничения бесплатных тарифов

| Сервис | Лимит | Что значит |
|---|---|---|
| **Render Free** | sleeps after 15 min idle, cold start ~30 с | При первом открытии после простоя — белый экран ~30 с. Для демо ок. |
| **Neon Free** | 0.5 GB storage, 1 compute hour/24h activity | На демо-нагрузку с запасом. |
| **Vercel Hobby** | 100 GB bandwidth/мес, неограничено static | Для оценки клиентом — с огромным запасом. |

Если клиент захочет всегда-on без cold-start — обнови Render до Starter ($7/мес), всё остальное оставляй на free.

---

## Обновление сайта

Сделал правку → `git push` в `main`:
- Vercel задеплоит фронт автоматически (~1-2 мин)
- Render задеплоит API автоматически (~3-5 мин с миграциями)

---

## Полезные команды

```bash
# Локально посмотреть как заведётся продакшен-билд
cd ~/Desktop/sami
npm run build           # сборка обоих
NODE_ENV=production node apps/api/dist/server.js

# Локально подцепить Neon вместо локального Postgres
echo "DATABASE_URL=postgresql://...neon.tech/..." >> apps/api/.env
npm --workspace @sami/api run db:migrate

# Логи Render (после установки render CLI)
brew install render
render login
render logs sami-api --tail

# Логи Vercel
brew install vercel-cli
vercel logs https://sami-xxxx.vercel.app
```
