import { Hono } from 'hono'
import { db } from '../db'
import { tables as tableTable } from '../db/schema/tables'
import { callRequests } from '../db/schema/callRequests'
import { CallRequestState } from '../types/callRequestState'
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


table.post('/call', async (c) => {
    try {
        const body = await c.req.json()
        const tableId = parseInt(body.tableId);
        const table = await db.select().from(tableTable).where(eq(tableTable.id, tableId));
        if (table.length === 0) {
            return c.text('Table not found', 404)
        }
        const callRequest = await db.select().from(callRequests).where(eq(callRequests.tableId, tableId));
        if (callRequest[0]?.state === CallRequestState.Pending) {
            return c.json({ message: 'Staff has already been called', callRequest: callRequest[0]});
        }
        const result = await db.insert(callRequests).values({
            tableId: tableId,
            state: CallRequestState.Pending
        }).returning();

        if (result.length === 0) {
            return c.text('An error occurred while calling for staff, please try again later.', 500)
        } else {
            return c.json({ message: 'Staff has been called'});
        }
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while calling for staff, please try again later.', 500)
    }
})

export default table