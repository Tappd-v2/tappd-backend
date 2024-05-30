import { Hono } from 'hono'
import { db } from '../db'
import { z } from 'zod'
import { users as userTable } from '../db/schema/users'
import { eq } from 'drizzle-orm'

const user = new Hono()

const userSchema = z.object({
    id: z.number(),
    email: z.string().email(),
    password: z.string().min(8)
})

user.post('/login', async (c) => {
    try {
        const body = await c.req.json()
        const users = await db.select().from(userTable).where(eq(userTable.email, body.email));
        const user = users[0]
        console.log(user)
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