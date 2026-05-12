# PeaceFlow Backend

Express API backed by PostgreSQL.

## Required environment

Copy `.env.example` to `.env` and set:

```env
HOST=0.0.0.0
PORT=4000
APP_URL=http://localhost:5500
# Or allow multiple frontend origins:
# APP_URLS=http://localhost:5500,http://192.168.1.10:5500,https://your-frontend-domain.com
# CORS_ORIGINS=http://localhost:5500,http://192.168.1.10:5500,https://your-frontend-domain.com
API_PREFIX=/api/v1
DATABASE_URL=postgresql://postgres:password@localhost:5432/peaceflow
JWT_ACCESS_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret
```

## Run

```bash
npm install
npm run dev
```

## Shared server / LAN use

If multiple people need to see the same data, they must use the same backend and the same PostgreSQL database.

Example backend `.env` for LAN:

```env
HOST=0.0.0.0
PORT=4000
APP_URLS=http://192.168.1.10:5500,http://localhost:5500
API_PREFIX=/api/v1
DATABASE_URL=postgresql://postgres:password@192.168.1.10:5432/peaceflow
```

Frontend runtime resolution now works like this:

- `localhost:*` -> `http://localhost:4000/api/v1`
- `http://192.168.x.x:5500` -> `http://192.168.x.x:4000/api/v1`
- same-origin deploy without explicit port -> `${origin}/api/v1`
- manual override via `localStorage.peaceflow_api_base_url`

Example manual override in browser console:

```js
localStorage.setItem('peaceflow_api_base_url', 'https://your-api-domain.com/api/v1')
```

## Database

SQL migrations and seed files live in `backend/db`.
