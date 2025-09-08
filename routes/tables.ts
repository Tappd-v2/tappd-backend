import { Hono } from 'hono'
import { db } from '../db'
import { tables as tableTable } from '../db/schema/tables'
import { callRequests } from '../db/schema/callRequests'
import { CallRequestState } from '../types/callRequestState'
import { eq } from 'drizzle-orm'
import { getUserWithPermissions } from '../kinde'
import { publish } from '../wsManager'
import { notifyLocationClients } from '../index'

const table = new Hono()

table.get('/', async (c) => {
    try {
        const locationId = c.req.param('location');
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

        // check existing call requests for this table
        const existing = await db.select().from(callRequests).where(eq(callRequests.tableId, tableId));
        const existingReq = existing && existing.length ? existing[0] : null;

        // helper to publish/notify
        const publishAndNotify = (callRecord: any) => {
            try {
                const tableInfo = table[0] ? { id: table[0].id, name: table[0].name, locationId: table[0].locationId } : null;
                const payload = { ...callRecord, table: tableInfo };
                const topicLocation = `calls:${tableInfo?.locationId}`;
                try {
                    if (tableInfo?.locationId) {
                        notifyLocationClients(tableInfo.locationId, { type: callRecord.id ? 'call_updated' : 'call_created', callRequest: payload });
                    }
                } catch (e) { /* ignore notification errors */ }
            } catch (e) {
                console.error('Failed to publish call request websocket message', e);
            }
        }

        if (!existingReq) {
            // no existing request -> create a new one
            const result = await db.insert(callRequests).values({
                tableId: tableId,
                state: CallRequestState.New
            }).returning();

            if (result.length === 0) {
                return c.text('An error occurred while calling for staff, please try again later.', 500)
            } else {
                const created = result[0];
                publishAndNotify(created);
                return c.json({ isNew: true, callRequest: created });
            }
        } else {
            // existing request found
            if (existingReq.state === CallRequestState.Pending) {
                // do nothing when pending
                return c.json({ isNew: false, callRequest: existingReq });
            }

            if (existingReq.state === CallRequestState.Fulfilled) {
                // reset done -> new
                const updateRes = await db.update(callRequests)
                    .set({ state: CallRequestState.New })
                    .where(eq(callRequests.id, existingReq.id))
                    .returning();

                if (!updateRes || updateRes.length === 0) {
                    return c.text('An error occurred while updating the call request, please try again later.', 500);
                }

                const updated = updateRes[0];
                publishAndNotify(updated);
                return c.json({ isNew: true, callRequest: updated });
            }

            // existing is New or other -> treat as already called
            return c.json({ isNew: false, callRequest: existingReq });
        }
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while calling for staff, please try again later.', 500)
    }
})

table.patch('/requests/:callId/state', getUserWithPermissions, async (c) => {
    try {
        const callId = Number(c.req.param('callId'));
        const body = await c.req.json();
        const newState: string = body.state;

        if (Number.isNaN(callId)) {
            return c.text('Invalid call id', 400);
        }

        const validStates = Object.values(CallRequestState);
        if (!validStates.includes(newState as any)) {
            return c.text(`Invalid state. Valid states: ${validStates.join(', ')}`, 400);
        }

        const existing = await db.select().from(callRequests).where(eq(callRequests.id, callId));
        if (!existing || existing.length === 0) {
            return c.text('Call request not found', 404);
        }

        const call = existing[0];

        // fetch table to determine location for permission check and websocket topics
        const tableRows = await db.select().from(tableTable).where(eq(tableTable.id, call.tableId));
        const locationId = tableRows[0]?.locationId;

        const permissions = (c.var && c.var.permissions) ? c.var.permissions : {} as any;
        const userOrgCode = (permissions.orgCode ?? permissions.orgcode ?? '') as string;

        if (!userOrgCode || userOrgCode !== locationId) {
            return c.text('Forbidden: you do not have permission to modify this call request', 403);
        }

        const result = await db.update(callRequests)
            .set({ state: newState })
            .where(eq(callRequests.id, callId))
            .returning();

        if (!result || result.length === 0) {
            return c.text('Call request not found', 404);
        }

        const updated = result[0];
        const updatedTable = tableRows[0] ? { id: tableRows[0].id, name: tableRows[0].name } : null;
        const payload = { ...updated, table: updatedTable };

        const topicGlobal = 'calls';
        const topicLocation = `calls:${locationId}`;
        publish(topicGlobal, { action: 'updated', callRequest: payload });
        publish(topicLocation, { action: 'updated', callRequest: payload });

        try {
            if (locationId) {
                notifyLocationClients(locationId, { type: 'call_updated', callRequest: payload });
            }
        } catch (e) { /* ignore notification errors */ }

        return c.json(updated);
    } catch (err) {
        console.error(err);
        return c.text('Failed to update call request state', 500);
    }
})

table.get('/requests', async (c) => {
    try {
        const locationId = c.req.param('location');
        const filterState = c.req.query('state') as string | undefined;

        const rows = await db.select({
            id: callRequests.id,
            tableId: callRequests.tableId,
            state: callRequests.state,
        })
        .from(callRequests)
        .leftJoin(tableTable, eq(callRequests.tableId, tableTable.id))

        // If a 'state' query param was provided (e.g. "new,pending"), split and normalize
        const states = filterState ? filterState.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : null;
        const filtered = (states && states.length > 0)
            ? rows.filter(r => states.includes((r.state ?? '').toString().toLowerCase()))
            : rows;

        return c.json(filtered || []);
    } catch (err) {
        console.error(err);
        return c.text('An error occurred while fetching call requests, please try again later.', 500);
    }
})

export default table