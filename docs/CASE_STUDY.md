# SettleUp — Case Study

## The Problem
Shared expenses create friction. Roommates, travel groups, and friend circles constantly lose track of who paid for dinner, groceries, or the Airbnb. Spreadsheets get out of date; “I’ll pay you later” gets forgotten. This leads to awkward money conversations and sometimes lost friendships.

## The Solution
SettleUp is a focused web app where users:
1. Create a group and invite members by email
2. Log expenses (who paid + amount)
3. Automatically split the cost equally (or with custom amounts via API)
4. Instantly see net balances (“Alice is owed $42”, “Bob owes $18”)
5. Settle up offline or with any payment app

## Target Users
- Roommates / apartment-mates
- Trip / festival groups
- Couples sharing costs
- Small friend circles who dine out often

## Tech Choices & Why

| Choice | Reason |
|--------|--------|
| React + Vite | Fast DX, excellent ecosystem, interview-friendly |
| TypeScript everywhere | Fewer runtime surprises, better IDE support |
| Prisma + SQLite | Type-safe queries, zero-config local DB, easy Postgres swap |
| JWT auth | Stateless, simple for SPA demos |
| Zod (client + server) | Single validation source, great error messages |
| TanStack Query | Built-in loading/error/cache → polished UX with little code |
| Tailwind | Rapid, consistent, responsive UI |

## Architecture
- Monorepo (backend / frontend)
- RESTful JSON API
- Role stored on GroupMember (OWNER | MEMBER)
- Protected routes on frontend + middleware on backend
- Equal-split algorithm handles floating-point remainder correctly

## Biggest Challenge
**Floating-point precision on equal splits.**  
If three people split $10, naïve `10/3` produces amounts that don’t sum back to 10.  
**Fix**: Round the share, assign it to n-1 members, give the exact remainder to the first member so the total is always exact.

## What I’d Build Next (Stretch)
- WebSocket live balance updates
- Receipt photo uploads (S3 / Cloudinary)
- “Settle up” deep links to Venmo / PayPal
- Dark mode
- GitHub Actions CI + Playwright e2e
- Docker Compose one-command start

## Metrics of Success for a Demo
- Register → create group → add expense → see correct balances in < 60 seconds
- Clear empty / loading / error states
- Role enforcement visible (member can’t add people)
- Seed data lets interviewer explore immediately
