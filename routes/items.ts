import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db'
import { items as itemTable } from '../db/schema/items'

const item = new Hono()

const itemSchema = z.object({
    id: z.number(),
    name: z.string().max(255),
    description: z.string().max(255),
    price: z.number().positive(),
    categoryId: z.number(),
    available: z.boolean(),
    max_per_order: z.number().positive()
})

item.get('/', async (c) => {
    try {
        const items = await db.select().from(itemTable).orderBy(itemTable.name)
        return c.json(items)
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching items, please try again later.', 500)
    }
})

export default item