# Zyphron Free Dashboard

Free game-server hosting panel. Users earn coins (daily login, afk, store) and spend
them to deploy servers through Pterodactyl. Admin side handles users, coins, plans,
tickets and the pterodactyl connection.

NestJS + TypeORM on the back, Vue 3 + Vite on the front, SQLite by default.

## stack

| layer | what |
|---|---|
| api | NestJS 11, TypeORM, JWT, passport |
| db | sqlite (`better-sqlite3`), mysql optional via `DB_TYPE=mysql` |
| ui | Vue 3, Pinia, vue-router, Tailwind 4 |
| mail | nodemailer, smtp configured from the admin panel |
| panel | Pterodactyl application api |
| process | pm2 (`ecosystem.config.js`) |

## run it locally

```bash
git clone https://github.com/SirYadav1/zyphron-free-dash.git
cd zyphron-free-dash
npm install
cp .env.example .env
```

minimum needed in `.env`:

```
JWT_SECRET=<32+ random chars>
PORT=3000
NODE_ENV=development
DB_TYPE=sqlite
ADMIN_KEY=<random setup key>
FRONTEND_URL=http://localhost:5173
```

then:

```bash
npm run dev          # backend :3000 + vite :5173 together
```

first admin is created once, with the key from `.env`:

```bash
curl -X POST http://localhost:3000/api/auth/setup-admin \
  -H 'Content-Type: application/json' \
  -d '{"setupKey":"<ADMIN_KEY>","username":"admin","email":"you@example.com","password":"Passw0rd1"}'
```

set `email_verified=1` for that row before the first login, sqlite does not do it for
you:

```bash
sqlite3 zyphron.db "update users set email_verified=1 where email='you@example.com';"
```

## production

```bash
npm run build          # client/dist + dist/
NODE_ENV=production node dist/src/main.js
```

`NODE_ENV=production` turns off TypeORM `synchronize` and makes the backend serve
`dist/client` itself. Put nginx in front for tls and upload size limits. the site
config is not in this repo yet (see `docs/security/FINAL.md`, ZY-06).

## layout

```
src/            nest modules, one folder per domain
  auth/         login, jwt, 2fa, password reset
  pterodactyl/  panel api client
  servers/      server create/renew/delete
  admin/        admin endpoints + settings
  common/       guards, decorators, encryption util
client/         vue app (views/, components/, stores/)
docs/security/  sprint notes + release closeout
supabase_schema.sql   legacy, mysql/sqlite is the real path now
```

## docs

- `docs/security/` - what was found, when, and what is still open
- `docs/PTERODACTYL-API.md` - panel endpoints this app calls

## known gaps

- no tests, no ci
- pterodactyl features need a real panel; without one, server pages load but do nothing
- mail needs working smtp, otherwise verification and reset emails are dropped

## license

see `LICENSE`.
