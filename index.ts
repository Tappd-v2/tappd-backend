import { Hono } from 'hono'
import { cors } from 'hono/cors'

import tableRouter from './routes/tables'
import categoryRouter from './routes/categories'
import itemRouter from './routes/items'
import orderRouter from './routes/orders'
import checkoutRouter from './routes/checkout'
import locationsRouter from './routes/locations'
import authRouter from './routes/auth'

const app = new Hono()


// CORS configuration
app.use(
  cors({
    origin: 'https://tappd-demo.lukasolivier.be', // Specify your front-end URL
    credentials: true, // Allow credentials
  })
)

app.route('/locations', locationsRouter)
app.route('/:location/tables', tableRouter)
app.route('/:location/categories', categoryRouter)
app.route('items', itemRouter)
app.route('orders', orderRouter)
app.route('/:location/checkout', checkoutRouter)
app.route('/', authRouter)

export default {
  port: 3030,
  fetch: app.fetch,
} 