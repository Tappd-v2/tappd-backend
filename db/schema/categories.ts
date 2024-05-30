import { pgTable, serial, varchar, integer, index } from 'drizzle-orm/pg-core';


export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    locationId: integer('location_id').notNull(),
},
    (categories) => {
        return {
            locationIdIndex: index('location_id_index').on(categories.locationId),
        };
    });
