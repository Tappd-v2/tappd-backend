
import { Hono } from 'hono'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

const checkout = new Hono()

checkout.post('/', async (c) => {
    try {
        const body = await c.req.json()
        const userId = body.userId;
        const tableId = body.tableId;
        const remarks = body.remarks;
        const location = body.location;

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
                success_url: `${process.env.CLIENT_URL}/venues/${location}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.CLIENT_URL}/venues/${location}/cancel`,
                metadata: {
                    userId: userId,
                    tableId: tableId,
                    remarks: remarks,
                    location: location,
                }
            })

            const responseObject = {
                id: session.id,
                items: body.items,
                table: body.table,
                remarks: body.remarks,
                location: body.location,
            }

            return c.json(responseObject)
        } catch (err) {
            console.error(err)
            return c.text('An error occurred while creating checkout, please try again later.', 500)
        }

    } catch (err) {
        console.error(err)
        return c.text('An error occurred while creating checkout, please try again later.', 500)
    }
})

export default checkout
