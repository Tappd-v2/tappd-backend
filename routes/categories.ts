import { Hono } from 'hono'
import { query } from '../db/database'

const category = new Hono()

category.get('/', async (c) => {
    try {
        const res = await query('SELECT * FROM categories')
        return c.json(res.rows)
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching categories, please try again later.', 500)
    }
})

export default category