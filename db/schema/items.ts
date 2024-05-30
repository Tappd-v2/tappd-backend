import { pgTable, serial, varchar, numeric, integer, boolean, index } from 'drizzle-orm/pg-core';


export const items = pgTable('items', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    description: varchar('description', { length: 256 }).notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    categoryId: integer('category_id').notNull(),
    available: boolean('available').notNull().default(true),
    maxPerOrder: integer('max_per_order')
},
    (items) => {
        return {
            categoryIdIndex: index('category_id_index').on(items.categoryId),
        };
    });
