import { Hono } from 'hono'
import { db } from '../db'
import { categories as categoryTable } from '../db/schema/categories'
import { eq } from 'drizzle-orm'

const category = new Hono()

category.get('/', async (c) => {
    try {
        const locationId = parseInt(c.req.param('location') || '0');
        const categories = await db.select().from(categoryTable).where(eq(categoryTable.locationId, locationId));
        return c.json(categories)
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching categories, please try again later.', 500)
    }
})

export default category