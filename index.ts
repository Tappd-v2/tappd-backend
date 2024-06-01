import { Hono } from 'hono'
import { cors } from 'hono/cors'

import tableRouter from './routes/tables'
import categoryRouter from './routes/categories'
import itemRouter from './routes/items'
import orderRouter from './routes/orders'
import checkoutRouter from './routes/checkout'
import userRouter from './routes/users'
import locationsRouter from './routes/locations'

const app = new Hono()

app.use(cors())

app.route('/locations', locationsRouter)
app.route('/:location/tables', tableRouter)
app.route('/:location/categories', categoryRouter)
app.route('items', itemRouter)
app.route('orders', orderRouter)
app.route('/:location/checkout', checkoutRouter)
app.route('users', userRouter)

export default {
  port: 3030,
  fetch: app.fetch,
} 