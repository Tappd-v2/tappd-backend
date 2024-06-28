import { pgTable, serial, varchar, integer, index } from 'drizzle-orm/pg-core';


export const tables = pgTable('tables', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    locationId: varchar('location_id').notNull(),
},
    (tables) => {
        return {
            locationIdIndex: index('table_location_id_index').on(tables.locationId),
        };
    });
