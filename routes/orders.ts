import { Hono } from 'hono'
import { query } from '../db/database'
import Stripe from 'stripe'

const order = new Hono()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

let orderDetails: any = {
    amount: null,
    receipt_url: null,
    userId: null,
    created_at: null
};

order.post('/save', async (c) => {
    try {
        console.log('Saving order...');
        const body = await c.req.json()
        const eventType = body.type
        const orderData = body.data.object;

        if (eventType === 'charge.succeeded') {
            orderDetails.amount = orderData.amount / 100; // Stripe sends in cents, but we want to store the amount in euros
            orderDetails.receipt_url = orderData.receipt_url;
        }

        if (eventType === 'checkout.session.completed') {
            orderDetails.userId = orderData.metadata.userId;
            orderDetails.created_at = new Date();
        }

        if (Object.values(orderDetails).some(value => value === null || value === undefined)) {
            return c.text('Got partial order data.', 200);
        }

        try {
            const res = await query('INSERT INTO orders (amount, receipt_url, user_id, created_at) VALUES ($1, $2, $3, $4)', [orderDetails.amount, orderDetails.receipt_url, orderDetails.userId, orderDetails.created_at]);
            orderDetails = {
                amount: null,
                receipt_url: null,
                userId: null,
                created_at: null
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
        console.log(id);
        const session = await stripe.checkout.sessions.retrieve(id);
        return c.json(session);
    } catch (err) {
        console.error(err);
        return c.text('An error occurred while fetching the order, please try again later.', 500);
    }
}
)


export default order;
