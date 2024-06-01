import { pgTable, serial, integer, index, varchar } from 'drizzle-orm/pg-core';
import { CallRequestState } from '../../types/callRequestState';


export const callRequests = pgTable('call_requests', {
    id: serial('id').primaryKey(),
    tableId: integer('table_id').notNull(),
    state: varchar('state').default(CallRequestState.New).notNull(),
},
    (callRequests) => {
        return {
            tableIdIndex: index('table_id_index').on(callRequests.tableId),
        };
    });
