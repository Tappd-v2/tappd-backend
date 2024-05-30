import { pgTable, serial, varchar, numeric, integer, index, timestamp } from 'drizzle-orm/pg-core';


export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    paymentId: varchar('payment_id', { length: 256 }).notNull(),
    tableId: integer('table_id').notNull(),
    stateId: integer('state_id').default(1).notNull(),
    totalPrice: numeric('price', { precision: 10, scale: 2 }).notNull(),
    remarks: varchar('remarks', { length: 256 }),
    receiptUrl: varchar('receipt_url').notNull(),
    createdAt: timestamp('created_at').notNull(),
},
    (orders) => {
        return {
            userIdIndex: index('order_user_id_index').on(orders.userId),
        };
    });
