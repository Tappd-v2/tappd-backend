import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createBunWebSocket } from 'hono/bun';
import tableRouter from './routes/tables'
import categoryRouter from './routes/categories'
import itemRouter from './routes/items'
import orderRouter from './routes/orders'
import checkoutRouter from './routes/checkout'
import locationsRouter from './routes/locations'
import authRouter from './routes/auth'

const app = new Hono()
const { upgradeWebSocket, websocket } = createBunWebSocket();

// in-memory registry of clients per location
const locationClients = new Map<string, Set<any>>();

export function notifyLocationClients(location: string, payload: any) {
  if (!location) return;
  const clients = locationClients.get(location);
  if (!clients || clients.size === 0) return;
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  for (const ws of clients) {
    try {
      if (typeof ws.send === 'function') ws.send(text);
      else if (typeof ws.sendText === 'function') ws.sendText(text);
    } catch (e) {
      // ignore per-client send errors
    }
  }
}

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://tappd-demo.lukasolivier.be' // Replace with your actual production domain
]

app.use(
  cors({
    origin: (origin) => {
      if (allowedOrigins.includes(origin)) {
        return origin
      }
      return null
    },
    credentials: true, 
  })
)

app.route('/locations', locationsRouter)
app.route('/:location/tables', tableRouter)
app.route('/:location/categories', categoryRouter)
app.route('/items', itemRouter)
app.route('/orders', orderRouter)
app.route('/:location/checkout', checkoutRouter)
app.route('/locations', locationsRouter)
app.route('/', authRouter)

// Mock endpoints to trigger websocket notifications for testing
app.post('/mock/notify', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const url = new URL(c.req.url);
    const location = body.location || url.searchParams.get('location');
    if (!location) return c.json({ ok: false, error: 'missing location' }, 400);
    const payload = body.payload ?? { type: 'mock', time: new Date().toISOString() };
    notifyLocationClients(location, payload);
    return c.json({ ok: true, notified: location });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});

app.get('/mock/notify', async (c) => {
  try {
    const url = new URL(c.req.url);
    const location = url.searchParams.get('location');
    if (!location) return c.json({ ok: false, error: 'missing location' }, 400);
    const payload = { type: 'mock', time: new Date().toISOString(), via: 'GET' };
    notifyLocationClients(location, payload);
    return c.json({ ok: true, notified: location });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});

const topic = 'orders';

export default {
  port: 3030,
  fetch(req, server) {
    // If this is a WebSocket upgrade request let Bun handle the upgrade and do not return a Response
    if (server && typeof server.upgrade === 'function' && server.upgrade(req)) {
      return; // do not return a Response for upgrades
    }

    // Route all other HTTP requests through the Hono app so middleware (CORS) and routes run
    return app.fetch(req, server);
  },
  websocket: {
    message(ws, message) {
      try {
        const text = typeof message === 'string' ? message : message.toString();
        const data = JSON.parse(text);
        if (data && data.locationId) {
          (ws as any).location = data.locationId;
          // register ws in locationClients
          try {
            let set = locationClients.get(data.locationId);
            if (!set) {
              set = new Set();
              locationClients.set(data.locationId, set);
            }
            set.add(ws);
          } catch (e) { /* ignore registry errors */ }

          try { ws.subscribe(data.locationId); } catch (e) { /* ignore if unsupported */ }
          try { if (typeof ws.sendText === 'function') ws.sendText(JSON.stringify({ type: 'init_ack', location: data.locationId })); } catch (e) { /* ignore send errors */ }
        }
      } catch (e) {
        console.warn('Failed to parse WS message', e);
      }
    },
    open(ws) {
      console.info('ws opened');
    },
    close(ws, code, message) {
      const loc = (ws as any).location;
      if (loc) {
        // remove from registry
        try {
          const set = locationClients.get(loc);
          if (set) {
            set.delete(ws);
            if (set.size === 0) locationClients.delete(loc);
          }
        } catch (e) { /* ignore */ }
      }

      if (loc && typeof ws.unsubscribe === 'function') {
        try { ws.unsubscribe(loc); } catch (e) { /* ignore */ }
      }
    },
    drain(ws) {}, // the socket is ready to receive more data
  },
}