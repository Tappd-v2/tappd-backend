import { Hono } from 'hono'
import { db } from '../db'
import { locations as locationTable } from '../db/schema/locations'
import { eq } from 'drizzle-orm'

const location = new Hono()

location.get('/', async (c) => {
    try {
        const locations = await db.select().from(locationTable);
        return c.json(locations)
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching categories, please try again later.', 500)
    }
})

location.get('/:id', async (c) => {
    try {
        const locationId = parseInt(c.req.param('id'));
        const location = await db.select().from(locationTable).where(eq(locationTable.id, locationId));
        if (location.length === 0) {
            return c.json('Location not found', 404)
        }
        return c.json(location[0])
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching location, please try again later.', 500)
    }
});

export default location