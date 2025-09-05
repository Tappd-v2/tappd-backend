import { Hono } from 'hono'
import { db } from '../db'
import { orders as orderTable } from '../db/schema/orders'
import { orderItems as orderItemsTable } from '../db/schema/orderItems'
import { items as ItemsTable } from '../db/schema/items'
import { tables as tablesTable } from '../db/schema/tables'
import { OrderDetails } from '../types/orderDetails';
import { eq } from 'drizzle-orm';

import { OrderState } from '../types/orderState';
import { getUserWithPermissions } from '../kinde';
import { and } from 'drizzle-orm';

const order = new Hono()

let orderDetails = new OrderDetails();

order.post('/save', async (c) => {
    try {
        const body = await c.req.json();
        const eventType = body.type;
        const orderData = body.data.object;

        console.log('Orderdata', orderData);

        if (eventType === 'charge.succeeded') {
            orderDetails.paymentId = orderData.id;
            orderDetails.totalPrice = orderData.amount / 100; // Stripe sends in cents, but we want to store the amount in euros
            orderDetails.receiptUrl = orderData.receipt_url;
        }

        if (eventType === 'checkout.session.completed') {
            orderDetails.sessionId = orderData.id;
            orderDetails.userId = orderData.metadata.userId;
            orderDetails.tableId = orderData.metadata.tableId;
            orderDetails.locationId = orderData.metadata.locationId;
            orderDetails.orderItems = JSON.parse(orderData.metadata.items || '[]');
            orderDetails.remarks = orderData.metadata.remarks || '';
            orderDetails.createdAt = new Date();
        }

        if (!orderDetails.isComplete()) {
            return c.text('Got partial order data.', 200);
        }

        let result; 
        try{
            result = await saveOrder(orderDetails);
            await saveItems(orderDetails.orderItems, result[0].id);

        } finally {
            orderDetails.reset();
            return c.json(result);
        }


    } catch (err) {
        console.error(err);
        return c.text('An error occurred while saving the order, please try again later.', 500);
    }
});


async function saveItems(orderItems: any[], orderId: number) {
    try {
        const items = orderItems.map((item: { id: number; name: string; price: string; quantity: number }) => ({
            itemId: item.id,
            amount: item.quantity.toString(), // Convert the amount to a string
            orderId: orderId,
        }));
       await db.insert(orderItemsTable).values(items).returning();
    } catch (err) {
        console.error(err);
        throw new Error('Failed to save order items');
    }
}

async function saveOrder(orderDetails: OrderDetails) {
    try {
        return await db.insert(orderTable).values({
            userId: orderDetails.userId,
            paymentId: orderDetails.paymentId,
            tableId: orderDetails.tableId,
            locationId: orderDetails.locationId,
            remarks: orderDetails.remarks,
            totalPrice: orderDetails.totalPrice,
            type: 'card', // TODO: Add support for other payment types
            createdAt: orderDetails.createdAt,
            receiptUrl: orderDetails.receiptUrl,
            sessionId: orderDetails.sessionId,
        }).returning();
    } catch (err) {
        console.error(err);
        throw new Error('Failed to save order');
    }
}

order.get('/:id', async (c) => {
    const orderId = c.req.param('id');
    const result = await db.select({
        id: orderTable.id,
        userId: orderTable.userId,
        sessionId: orderTable.sessionId,
        paymentId: orderTable.paymentId,
        tableId: orderTable.tableId,
        tableName: tablesTable.name,
        locationId: orderTable.locationId,
        state: orderTable.state,
        totalPrice: orderTable.totalPrice,
        createdAt: orderTable.createdAt,
        receiptUrl: orderTable.receiptUrl,
        remarks: orderTable.remarks,
    })
    .from(orderTable)
    .leftJoin(tablesTable, eq(tablesTable.id, orderTable.tableId))
    .where(eq(orderTable.sessionId, orderId));

    const raw = result[0];
    if (!raw) return c.json(raw);

    const { tableId, tableName, ...rest } = raw as any;
    const orderWithTable = {
        ...rest,
        table: {
            id: tableId,
            name: tableName,
        }
    };

    return c.json(orderWithTable);
});

order.get('/', async (c) => {
    const userId = c.req.query('userId');
    const locationId = c.req.query('locationId');
    const baseQuery = db.select({
        id: orderTable.id,
        tableId: orderTable.tableId,
        tableName: tablesTable.name,
        state: orderTable.state,
        totalPrice: orderTable.totalPrice,
        createdAt: orderTable.createdAt,
        receiptUrl: orderTable.receiptUrl,
        remarks: orderTable.remarks,
    })
    .from(orderTable)
    .leftJoin(tablesTable, eq(tablesTable.id, orderTable.tableId));

    if (userId) {
        baseQuery.where(eq(orderTable.userId, userId));
    }

    if (locationId) {
        baseQuery.where(eq(orderTable.locationId, locationId));
    }

    const orders = await baseQuery.orderBy(orderTable.createdAt);

    // Fetch items for each order and nest table info under `table`
    const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
            const items = await db.select({
                name: ItemsTable.name,
                amount: orderItemsTable.amount,
                price: ItemsTable.price,
            })
            .from(orderItemsTable)
            .leftJoin(ItemsTable, eq(ItemsTable.id, orderItemsTable.itemId))
            .where(eq(orderItemsTable.orderId, order.id));

            const { tableId, tableName, ...rest } = order as any;
            return {
                ...rest,
                table: {
                    id: tableId,
                    name: tableName,
                },
                items
            };
        })
    );

    return c.json(ordersWithItems);
});


order.patch('/:orderId/state', getUserWithPermissions, async (c) => {
    try {
        const orderId = Number(c.req.param('orderId'));
        const body = await c.req.json();
        const newState: string = body.state;

        // Validate orderId
        if (Number.isNaN(orderId)) {
            return c.text('Invalid order id', 400);
        }

        // Validate state
        const validStates = Object.values(OrderState);
        if (!validStates.includes(newState as OrderState)) {
            return c.text(`Invalid state. Valid states: ${validStates.join(', ')}`, 400);
        }

        // Fetch existing order to check location permission
        const existing = await db.select().from(orderTable).where(eq(orderTable.id, orderId));
        if (!existing || existing.length === 0) {
            return c.text('Order not found', 404);
        }

        const orderLocationId = existing[0].locationId;

        const permissions = (c.var && c.var.permissions) ? c.var.permissions : {} as any;
        const userOrgCode = (permissions.orgCode ?? permissions.orgcode ?? '') as string;

        if (!userOrgCode || userOrgCode !== orderLocationId) {
            return c.text('Forbidden: you do not have permission to modify this order', 403);
        }

        // Update the order where id matches (permission already validated)
        const result = await db.update(orderTable)
            .set({ state: newState })
            .where(eq(orderTable.id, orderId))
            .returning();

        if (!result || result.length === 0) {
            return c.text('Order not found', 404);
        }

        return c.json(result[0]);
    } catch (err) {
        console.error(err);
        return c.text('Failed to update order state', 500);
    }
});



export default order;

