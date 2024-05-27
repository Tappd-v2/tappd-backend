import { Hono } from 'hono'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

const checkout = new Hono()

checkout.post('/', async (c) => {
    try {
        const body = await c.req.json()
        const userId = 1; // TODO: Implement user authentication

        const transformedItems = body.items.map((item: { name: string; price: number; quantity: number }) => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price * 100, // Stripe expects amount in cents
            },
            quantity: item.quantity,
        }))

        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card', 'bancontact'],
                line_items: transformedItems,
                mode: 'payment',
                success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.CLIENT_URL}/cancel`,
                metadata: {
                    userId,
                }
            })
            return c.json({ id: session.id })
        }
        catch (err) {
            console.error(err)
            return c.text('An error occurred while creating checkout, please try again later.', 500)
        }

    } catch (err) {
        console.error(err)
        return c.text('An error occurred while creating checkout, please try again later.', 500)
    }
})

export default checkout