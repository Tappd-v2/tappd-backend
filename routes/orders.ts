import { Hono } from 'hono'
import { db } from '../db'
import { orders as orderTable } from '../db/schema/orders'
import { users as userTable } from '../db/schema/users'
import { OrderDetails } from '../models/orderDetails';
import { z } from 'zod'
import { eq } from 'drizzle-orm';

const order = new Hono()

const orderSchema = z.object({
    id: z.number(),
    userId: z.number(),
    paymentId: z.string(),
    tableId: z.number(),
    remarks: z.string(),
    state: z.string(),
    totalPrice: z.number(),
    type: z.string(),
    createdAt: z.string(),
    receiptUrl: z.string()
});

let orderDetails = new OrderDetails();

order.post('/save', async (c) => {
    try {
        console.log('Received order data:');
        const body = await c.req.json();
        const eventType = body.type;
        const orderData = body.data.object;

        if (eventType === 'charge.succeeded') {
            orderDetails.totalPrice = orderData.amount / 100; // Stripe sends in cents, but we want to store the amount in euros
            orderDetails.receiptUrl = orderData.receipt_url;
        }

        if (eventType === 'checkout.session.completed') {
            orderDetails.paymentId = orderData.id;
            orderDetails.userId = orderData.metadata.userId;
            orderDetails.tableId = orderData.metadata.tableId;
            orderDetails.remarks = orderData.metadata.remarks || '';
            orderDetails.createdAt = new Date();
        }

        console.log('Order details:', orderDetails);

        if (!orderDetails.isComplete()) {
            return c.text('Got partial order data.', 200);
        }

        console.log('Saving order:', orderDetails);

        try {
            const result = await db.insert(orderTable).values({
                userId: orderDetails.userId,
                paymentId: orderDetails.paymentId,
                tableId: orderDetails.tableId,
                remarks: orderDetails.remarks,
                totalPrice: orderDetails.totalPrice,
                type: 'card', // TODO: Add support for other payment types
                createdAt: orderDetails.createdAt,
                receiptUrl: orderDetails.receiptUrl
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
    try {
        const id = c.req.param('id');
        const order = (await db.select().from(orderTable).leftJoin(userTable, eq(orderTable.userId, userTable.id)).where(eq(orderTable.paymentId, id)));
        return c.json(order[0]);
    } catch (err) {
        console.error(err);
        return c.text('An error occurred while fetching the order, please try again later.', 500);
    }
});

export default order;