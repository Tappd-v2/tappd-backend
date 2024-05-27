import { Hono } from 'hono'
import { query } from '../db/database'

const order = new Hono()

let orderDetails: any = {
    order_id: null,
    amount: null,
    receipt_url: null,
    userId: null,
    created_at: null,
    table_id: null,
    remarks: null
};

order.post('/save', async (c) => {
    try {
        const body = await c.req.json()
        const eventType = body.type
        const orderData = body.data.object;

        if (eventType === 'charge.succeeded') {
            orderDetails.amount = orderData.amount / 100; // Stripe sends in cents, but we want to store the amount in euros
            orderDetails.receipt_url = orderData.receipt_url;
        }

        if (eventType === 'checkout.session.completed') {
            orderDetails.order_id = orderData.id;
            orderDetails.userId = orderData.metadata.userId;
            orderDetails.table_id = orderData.metadata.tableId;
            orderDetails.remarks = orderData.metadata.remarks ? orderData.metadata.remarks : '';
            orderDetails.created_at = new Date();
        }

        if (Object.values(orderDetails).some(value => value === null || value === undefined)) {
            return c.text('Got partial order data.', 200);
        }

        try {
            const res = await query('INSERT INTO orders (amount, receipt_url, user_id, created_at, order_id, table_id, remarks) VALUES ($1, $2, $3, $4, $5, $6, $7)', [orderDetails.amount, orderDetails.receipt_url, orderDetails.userId, orderDetails.created_at, orderDetails.order_id, orderDetails.table_id, orderDetails.remarks]);
            orderDetails = {
                order_id: null,
                amount: null,
                receipt_url: null,
                userId: null,
                created_at: null,
                table_id: null,
                remarks: null
            };
            return c.json(res.rows);

        } catch (err) {
            console.error(err);
            return c.text('An error occurred while saving the order, please try again later.', 500);
        }
    } catch (err) {
        console.error(err);
        return c.text('An error occurred while saving the order, please try again later.', 500);
    }
})

order.get(':id', async (c) => {
    try {
        const id = c.req.param('id');
        const res = await query('SELECT * FROM orders JOIN users ON orders.user_id = users.id WHERE orders.order_id = $1', [id]);
        return c.json(res.rows[0]);
    } catch (err) {
        console.error(err);
        return c.text('An error occurred while fetching the order, please try again later.', 500);
    }
}
)


export default order;
