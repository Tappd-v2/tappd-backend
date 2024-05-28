# Tappd backend
This is the repository for the backend for Tappd. Made in Bun with Hono.

## Development
To start the server, run `bun --watch index.ts`. This will start the server on port 3030.

Make sure to forward the Stripe webhook to the server. You can do this by running `.\stripe.exe listen --forward-to localhost:3030/orders/save  --events=checkout.session.completed,charge.succeeded`.