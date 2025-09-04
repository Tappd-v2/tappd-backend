import { Hono } from 'hono'
import { db } from '../db'
import { orders as orderTable } from '../db/schema/orders'
import { orderItems as orderItemsTable } from '../db/schema/orderItems'
import { items as ItemsTable } from '../db/schema/items'
import { OrderDetails } from '../types/orderDetails';
import { eq } from 'drizzle-orm';

const order = new Hono()

let orderDetails = new OrderDetails();

order.post('/save', async (c) => {
    try {
        const body = await c.req.json();
        const eventType = body.type;
        const orderData = body.data.object;

        if (eventType === 'charge.succeeded') {
            orderDetails.paymentId = orderData.id;
            orderDetails.totalPrice = orderData.amount / 100; // Stripe sends in cents, but we want to store the amount in euros
            orderDetails.receiptUrl = orderData.receipt_url;
        }

        if (eventType === 'checkout.session.completed') {
            orderDetails.sessionId = orderData.id;
            orderDetails.userId = orderData.metadata.userId;
            orderDetails.tableId = orderData.metadata.tableId;
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
    const result = await db.select().from(orderTable)
    .where(eq(orderTable.sessionId, orderId));
    return c.json(result[0]);
});

order.get('/', async (c) => {
    const userId = c.req.query('userId');
    const baseQuery = db.select({
        id: orderTable.id,
        table: orderTable.tableId,
        state: orderTable.state,
        totalPrice: orderTable.totalPrice,
        createdAt: orderTable.createdAt,
        receiptUrl: orderTable.receiptUrl,
        remarks: orderTable.remarks,
    })
    .from(orderTable);

    if (userId) {
        baseQuery.where(eq(orderTable.userId, userId));
    }

    const orders = await baseQuery.orderBy(orderTable.createdAt);

    // Fetch items for each order
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

            return {
                ...order,
                items
            };
        })
    );

    return c.json(ordersWithItems);
});

export default order;
