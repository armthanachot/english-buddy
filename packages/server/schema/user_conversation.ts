import { pgTable, varchar, timestamp, uuid, boolean, text } from "drizzle-orm/pg-core";
import { userTable } from "./user";

export const userConversationTable = pgTable("user_conversations", {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().references(() => userTable.id).notNull(),
    conversationId: text().notNull(),
    type: varchar("type"),
    isActive: boolean().notNull().default(true),
    deletedAt: timestamp("deletedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date())
});