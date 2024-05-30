# Tappd backend
This is the repository for the backend for Tappd. Made in Bun with Hono.

## Development
To start the server, run `bun --watch index.ts`. This will start the server on port 3030.

Make sure to forward the Stripe webhook to the server. You can do this by running `.\stripe.exe listen --forward-to localhost:3030/orders/save  --events=checkout.session.completed,charge.succeeded`.

## Drizzle

**Migrating**
1. Run `bun drizzle-kit generate` to generate the files.
2. Run `bun .\migrate.ts` to migrate the database.
   
**Viewing the database**
- You can view the database by running `bunx drizzle-kit studio`.
