import { Type as t, type Static } from "@sinclair/typebox";

export const CreateUserConversationRequestSchema = t.Object({
    userId: t.String(),
    type: t.Union([t.Literal("Translator"), t.Literal("Situation"), t.Literal("UsageExplanation"), t.Literal("KeywordDetect")]),
});

export const DeleteUserConversationRequestSchema = t.Object({
    userId: t.String(),
    conversationId: t.String(),
});

export type CreateUserConversationRequest = Static<typeof CreateUserConversationRequestSchema>;
export type DeleteUserConversationRequest = Static<typeof DeleteUserConversationRequestSchema>;