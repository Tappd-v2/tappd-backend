import { Hono } from 'hono'
import { query } from '../db/database'

const table = new Hono()

table.get('/', async (c) => {
    try {
        const res = await query('SELECT * FROM tables')
        return c.json(res.rows)
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching tables, please try again later.', 500)
    }
})

export default table