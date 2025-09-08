import { Hono } from 'hono'
import Stripe from 'stripe'
import { db } from '../db'
import { items as itemsTable } from '../db/schema/items'
import { eq } from 'drizzle-orm'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

const checkout = new Hono()

checkout.post('/', async (c) => {
    try {
        const body = await c.req.json()
        const userId = body.userId;
        const tableId = body.tableId;
        const tableName = body.tableName;
        const remarks = body.remarks;
        const locationId = body.locationId;
        const items = body.items;

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

        // verify items availability (if items include id)
        const itemIds = (items || []).map((it: any) => it && it.id).filter((id: any) => typeof id !== 'undefined')
        if (itemIds.length > 0) {
            for (const itemId of itemIds) {
                const rows = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId))
                if (!rows || rows.length === 0) {
                    console.log('Item not found for id:', itemId);
                    return c.json({ error: 'One or more items not found' }, 400)
                }
                const dbItem = rows[0] as any
                if (dbItem.available === false) {
                    console.log('Item not available:', dbItem);
                    return c.json({ error: 'De volgende item(s) is/zijn niet meer beschikbaar: ' + dbItem.name + ". Gelieve ze te verwijderen / vervangen." }, 400)
                }
            }
        }

        try {
            const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'bancontact'],
            line_items: transformedItems,
            mode: 'payment',
            success_url: `${process.env.KINDE_SITE_URL}/venues/${locationId}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.KINDE_SITE_URL}/venues/${locationId}/cancel`,
            metadata: {
                userId: userId,
                tableId: tableId,
                tableName: tableName,
                remarks: remarks,
                locationId: locationId,
                items: JSON.stringify(items),
            }
            })

            const responseObject = {
                id: session.id,
                items: body.items,
                table: {
                    id: tableId,
                    name: tableName,
                },
                remarks: body.remarks,
                locationId: body.locationId,
                userId: body.userId,
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
