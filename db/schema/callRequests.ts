import { pgTable, serial, varchar, integer, index } from 'drizzle-orm/pg-core';


export const callRequests = pgTable('call_requests', {
    id: serial('id').primaryKey(),
    tableId: integer('table_id').notNull(),
    stateId: integer('state_id').notNull(),
},
    (callRequests) => {
        return {
            tableIdIndex: index('table_id_index').on(callRequests.tableId),
            stateIdIndex: index('state_id_index').on(callRequests.stateId),
        };
    });
