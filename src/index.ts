import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello hono from Bun!')
})

export default app
