import { Hono } from 'hono'
import { query } from '../db/database'

const item = new Hono()

item.get('/', async (c) => {
    try {
        const res = await query('SELECT * FROM items')
        return c.json(res.rows)
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching items, please try again later.', 500)
    }
})

export default item