import { pgTable, serial, integer, index } from 'drizzle-orm/pg-core';


export const favorites = pgTable('favorites', {
    id: serial('id').primaryKey(),
    itemId: integer('item_id').notNull(),
    userId: integer('user_id').notNull(),
},
    (favorites) => {
        return {
            itemIdIndex: index('favorite_item_id_index').on(favorites.itemId),
            userIdIndex: index('favorite_user_id_index').on(favorites.userId),
        };
    });
