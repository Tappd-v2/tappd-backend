import { pgTable, serial, varchar, index } from 'drizzle-orm/pg-core';


export const states = pgTable('states', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
},
    (states) => {
        return {
            nameIndex: index('state_name_index').on(states.name),
        };
    });
