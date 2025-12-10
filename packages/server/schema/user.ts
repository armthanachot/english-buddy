import { pgTable, varchar, timestamp, uuid, boolean } from "drizzle-orm/pg-core";


export const userTable = pgTable("users", {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar().notNull(),
    email: varchar().notNull(),
    isActive: boolean().notNull().default(true),
    deletedAt: timestamp("deletedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date())
});