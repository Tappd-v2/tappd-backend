import { Hono } from 'hono'
import { db } from '../db'
import { orders as orderTable } from '../db/schema/orders'
import { OrderDetails } from '../models/orderDetails';
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
            orderDetails.remarks = orderData.metadata.remarks || '';
            orderDetails.createdAt = new Date();
        }

        if (!orderDetails.isComplete()) {
            return c.text('Got partial order data.', 200);
        }

        try {
            const result = await db.insert(orderTable).values({
                userId: orderDetails.userId,
                paymentId: orderDetails.paymentId,
                tableId: orderDetails.tableId,
                remarks: orderDetails.remarks,
                totalPrice: orderDetails.totalPrice,
                type: 'card', // TODO: Add support for other payment types
                createdAt: orderDetails.createdAt,
                receiptUrl: orderDetails.receiptUrl,
                sessionId: orderDetails.sessionId
            }).returning();

            orderDetails.reset();
            return c.json(result);
        } catch (err) {
            console.error(err);
            return c.text('An error occurred while saving the order, please try again later.', 500);
        }
    } catch (err) {
        console.error(err);
        return c.text('An error occurred while saving the order, please try again later.', 500);
    }
});

order.get('/:id', async (c) => {
    const orderId = c.req.param('id');
    const result = await db.select().from(orderTable).where(eq(orderTable.sessionId, orderId));
    return c.json(result[0]);
});

order.get('/', async (c) => {
    const userId = c.req.query('userId');
    const result = await db.select().from(orderTable).where(eq(orderTable.userId, userId));
    return c.json(result);
});

export default order;