import { ResSchema } from "../response";
import { Type as t, type Static } from "@sinclair/typebox";

export const CreateUserConversationResponseSchema = ResSchema(t.Object({
    conversationId: t.String(),
}))

export type CreateUserConversationResponseSchemaType = Static<typeof CreateUserConversationResponseSchema>;