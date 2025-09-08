import { Hono } from 'hono'
import { db } from '../db'
import { items as itemTable } from '../db/schema/items'
import { categories as categoryTable } from '../db/schema/categories'
import { locations as locationsTable } from '../db/schema/locations'
import { eq } from 'drizzle-orm'
import category from './categories'
import { getUserWithPermissions } from '../kinde';

const item = new Hono()

item.get('/', async (c) => {
    try {
        const categoryId = parseInt(c.req.query('categoryId') || '0')
        const items = categoryId != 0 ? await db.select().from(itemTable).where(eq(itemTable.categoryId, categoryId)) : await db.select().from(itemTable)
        return c.json(items)
    } catch (err) {
        console.error(err)
        return c.text('An error occurred while fetching items, please try again later.', 500)
    }
})

item.post('/:id/toggle-availability', getUserWithPermissions, async (c) => {
	try {
		const id = parseInt(c.req.param('id') || '0')
		if (!id) return c.text('Invalid item id', 400)

		// fetch item and verify org permission
		const items = await db.select().from(itemTable).where(eq(itemTable.id, id))
		if (!items || items.length === 0) return c.text('Item not found', 404)
		const itemRecord = items[0] as any

        const permissions = (c.var && c.var.permissions) ? c.var.permissions : {} as any;
        const userOrgCode = (permissions.orgCode ?? permissions.orgcode ?? '') as string;

        const itemCategoryId = itemRecord.categoryId;
        const category = itemCategoryId ? await db.select().from(categoryTable).where(eq(categoryTable.id, itemCategoryId)).then(res => res[0]) : null;

        console.log('itemCategoryId', itemCategoryId);
        console.log('category?.locationId', category?.locationId);
        console.log('userOrgCode', userOrgCode);

        if (!userOrgCode || userOrgCode !== category?.locationId) {
            return c.text('Forbidden: you do not have permission to modify this order', 403);
        }

		// toggle availability
		const currentAvailable = typeof itemRecord.available === 'boolean' ? itemRecord.available : true
		const newAvailable = !currentAvailable

		await db.update(itemTable).set({ available: newAvailable }).where(eq(itemTable.id, id))

		const updated = await db.select().from(itemTable).where(eq(itemTable.id, id))
		if (!updated || updated.length === 0) return c.text('Item not found', 404)

		return c.json(updated[0])
	} catch (err) {
		console.error(err)
		return c.text('An error occurred while updating item availability.', 500)
	}
})


export default item