import { pgTable, serial, numeric, integer, index } from 'drizzle-orm/pg-core';


export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull(),
    itemId: integer('item_id').notNull(),
    amount: numeric('amount').notNull(),
},
    (items) => {
        return {
            orderIdIndex: index('order_id_index').on(items.orderId),
            itemIdIndex: index('item_id_index').on(items.itemId),
        };
    });
