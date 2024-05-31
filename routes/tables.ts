import { Hono } from 'hono'
import { db } from '../db'
import { tables as tableTable } from '../db/schema/tables'
import { eq } from 'drizzle-orm'

const table = new Hono()

table.get('/', async (c) => {
    try {
        const locationId = parseInt(c.req.param('location') || '0');
        const tables = await db.select().from(tableTable).where(eq(tableTable.locationId, locationId));
        return c.json(tables)
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching tables, please try again later.', 500)
    }
})

export default table