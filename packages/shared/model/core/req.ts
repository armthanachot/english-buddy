import { Type as t, type Static } from "@sinclair/typebox";

export const CreateUserConversationRequestSchema = t.Object({
    userId: t.String(),
});

export type CreateUserConversationRequest = Static<typeof CreateUserConversationRequestSchema>;
