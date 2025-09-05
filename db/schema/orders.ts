import { pgTable, serial, varchar, numeric, integer, timestamp } from 'drizzle-orm/pg-core';
import { OrderState } from '../../types/orderState';


export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id'),
    sessionId: varchar('session_id', { length: 256 }).notNull(),
    paymentId: varchar('payment_id', { length: 256 }).notNull().unique(),
    tableId: integer('table_id').notNull(),
    locationId: varchar('location_id').notNull(),
    state: varchar('state').default(OrderState.New).notNull(),
    totalPrice: numeric('price', { precision: 10, scale: 2 }).notNull(),
    remarks: varchar('remarks', { length: 256 }),
    receiptUrl: varchar('receipt_url').notNull(),
    createdAt: timestamp('created_at').notNull(),
});
