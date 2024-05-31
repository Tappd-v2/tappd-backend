import { Hono } from 'hono'
import { db } from '../db'
import { users as userTable } from '../db/schema/users'
import { eq } from 'drizzle-orm'

const user = new Hono()

user.post('/login', async (c) => {
    try {
        const body = await c.req.json()
        const users = await db.select().from(userTable).where(eq(userTable.email, body.email));
        const user = users[0]
        if (!user) {
            return c.text('Invalid email or password.', 401)
        }
        return c.json(user)
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching items, please try again later.', 500)
    }
})

export default user