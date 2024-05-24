import { Hono } from 'hono'
import { cors } from 'hono/cors'

import tableRouter from './routes/tables'

const app = new Hono()
app.use(cors())

app.route('/tables', tableRouter)

export default {
  port: 3030,
  fetch: app.fetch,
} 