import { Hono } from 'hono'
import { query } from '../db/database'

const user = new Hono()

user.post('/login', async (c) => {
    try {
        const body = await c.req.json()
        console.log(body)
        const res = await query('SELECT * FROM users WHERE email = $1 AND password = $2', [body.email, body.password])
        if (res.rows.length === 0) {
            return c.text('Invalid email or password.', 401)
        }
        return c.json(res.rows[0])
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching items, please try again later.', 500)
    }
})

export default user