import { Hono } from 'hono'
import { query } from '../db/database.js'

const table = new Hono()

table.get('/', async (c) => {
    try {
        const res = await query('SELECT * FROM items')
        return c.json(res.rows)
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching items, please try again later.', 500)
    }
})

export default table