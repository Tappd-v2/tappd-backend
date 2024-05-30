import { Hono } from 'hono'
import { db } from '../db'
import { z } from 'zod'
import { categories as categoryTable } from '../db/schema/categories'

const category = new Hono()

const categorySchema = z.object({
    id: z.number(),
    name: z.string().max(255),
    locationId: z.number()
})

type Category = z.infer<typeof categorySchema>

category.get('/', async (c) => {
    try {
        const categories = await db.select().from(categoryTable).orderBy(categoryTable.name)
        return c.json(categories)
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching categories, please try again later.', 500)
    }
})

export default category