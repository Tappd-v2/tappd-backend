import { pgTable, serial, integer, index, varchar } from 'drizzle-orm/pg-core';


export const favorites = pgTable('favorites', {
    id: serial('id').primaryKey(),
    itemId: integer('item_id').notNull(),
    userId: varchar('user_id').notNull(),
},
    (favorites) => {
        return {
            itemIdIndex: index('favorite_item_id_index').on(favorites.itemId),
        };
    });
