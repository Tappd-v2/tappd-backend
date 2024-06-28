import { pgTable, varchar, index } from 'drizzle-orm/pg-core';


export const locations = pgTable('locations', {
    id: varchar('id').primaryKey(), // Kinde org code
    name: varchar('name', { length: 256 }).notNull(),
    description: varchar('description', { length: 256 }).notNull(),
},
    (locations) => {
        return {
            nameIndex: index('location_name_index').on(locations.name),
        };
    });
