import { Hono } from 'hono'
import { db } from '../db'
import { items as itemTable } from '../db/schema/items'
import { eq } from 'drizzle-orm'

const item = new Hono()

item.get('/', async (c) => {
    try {
        const categoryId = parseInt(c.req.query('categoryId') || '0')
        const items = categoryId != 0 ? await db.select().from(itemTable).where(eq(itemTable.categoryId, categoryId)) : await db.select().from(itemTable)
        return c.json(items)
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching items, please try again later.', 500)
    }
})


export default item