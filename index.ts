import { Hono } from 'hono'
import { cors } from 'hono/cors'

import tableRouter from './routes/tables'
import categoryRouter from './routes/categories'
import itemRouter from './routes/items'

const app = new Hono()
app.use(cors())

app.route('/tables', tableRouter)
app.route('/categories', categoryRouter)
app.route('/items', itemRouter)

export default {
  port: 3030,
  fetch: app.fetch,
} 