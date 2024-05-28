import { Hono } from 'hono'
import { query } from '../db/database'
import { OrderDetails } from '../models/orderDetails';

const order = new Hono()

let orderDetails = new OrderDetails();

order.post('/save', async (c) => {
    try {
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

        if (!orderDetails.isComplete()) {
            return c.text('Got partial order data.', 200);
        }

        try {
            const res = await query('INSERT INTO orders (total_price, receipt_url, user_id, created_at, payment_id, table_id, remarks) VALUES ($1, $2, $3, $4, $5, $6, $7)', [
                orderDetails.totalPrice,
                orderDetails.receiptUrl,
                orderDetails.userId,
                orderDetails.createdAt,
                orderDetails.paymentId,
                orderDetails.tableId,
                orderDetails.remarks
            ]);
            orderDetails.reset();
            return c.json(res.rows);
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
        const res = await query('SELECT * FROM orders JOIN users ON orders.user_id = users.id WHERE orders.payment_id = $1', [id]);
        return c.json(res.rows[0]);
    } catch (err) {
        console.error(err);
        return c.text('An error occurred while fetching the order, please try again later.', 500);
    }
});

export default order;
