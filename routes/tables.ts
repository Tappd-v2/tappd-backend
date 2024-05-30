import { Hono } from 'hono'
import { db } from '../db'
import { z } from 'zod'
import { tables as tableTable } from '../db/schema/tables'

const table = new Hono()

const tableSchema = z.object({
    id: z.number(),
    name: z.string().max(255),
    locationId: z.number()
})

table.get('/', async (c) => {
    try {
        const tables = await db.select().from(tableTable).orderBy(tableTable.name)
        return c.json(tables)
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching tables, please try again later.', 500)
    }
})

export default table