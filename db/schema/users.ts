import { pgTable, serial, varchar, index } from 'drizzle-orm/pg-core';


export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 256 }).notNull(),
    password: varchar('password', { length: 256 }).notNull(),
    email: varchar('email', { length: 256 }).notNull(),
},
    (users) => {
        return {
            emailIndex: index('email_id_index').on(users.email),
        };
    });
