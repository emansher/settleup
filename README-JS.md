# SettleUp (JavaScript version) 💰

Plain **JavaScript** version (no TypeScript).

## How to run

```bash
# 1. Backend
cd backend-js
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
# → http://localhost:4000

# 2. Frontend (new terminal)
cd frontend-js
npm install
npm run dev
# → http://localhost:5173
```

## Demo logins
- alice@example.com / password123
- bob@example.com / password123
- carol@example.com / password123

## File types
- Backend: `.js`
- Frontend: `.jsx` (React) + `.js`
- Config: `.json`, `.js`
- Database schema: `.prisma`

No `.ts` or `.tsx` files.
