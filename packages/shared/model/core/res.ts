import { ResSchema } from "../response";
import { Type as t, type Static } from "@sinclair/typebox";

export const CreateUserConversationResponseSchema = ResSchema(t.Object({
    conversationId: t.String(),
}))

export const SetUserConversationAvailableResponseSchema = ResSchema(t.Object({
    success: t.Boolean(),
}))

export const DeleteUserConversationResponseSchema = ResSchema(t.Object({
    success: t.Boolean(),
}))

export const ClearAllConversationResponseSchema = ResSchema(t.Object({
    success: t.Boolean(),
}))

export type CreateUserConversationResponseSchemaType = Static<typeof CreateUserConversationResponseSchema>;
export type SetUserConversationAvailableResponseSchemaType = Static<typeof SetUserConversationAvailableResponseSchema>;
export type DeleteUserConversationResponseSchemaType = Static<typeof DeleteUserConversationResponseSchema>;
export type ClearAllConversationResponseSchemaType = Static<typeof ClearAllConversationResponseSchema>;