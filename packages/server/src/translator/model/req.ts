import { t, type Static } from 'elysia'
import { MAPPING_INSTRUCTION } from '../constant/instruction';

export const FileUploadRequestSchema = t.Object({
    file: t.File(),
    targetLanguage: t.Union([t.Literal("TH"), t.Literal("EN"), t.Literal("JA"), t.Literal("ZH"), t.Literal("VI"), t.Literal("ID")]),
    userId: t.String(),
});

export const AIParseSchema = t.Object({
    userId: t.String(),
    type: t.Union(Object.keys(MAPPING_INSTRUCTION).map(key => t.Literal(key as keyof typeof MAPPING_INSTRUCTION))),
})

export const ConversationRequestSchema = t.Object({
    conversationId: t.String(),
    prompt: t.String(),
    outputLanguage: t.Union([t.Literal("TH"), t.Literal("EN"), t.Literal("JA"), t.Literal("ZH"), t.Literal("VI"), t.Literal("ID")]),
})

export type FileUploadRequestSchemaType = Static<typeof FileUploadRequestSchema>;
export type AIParseSchemaType = Static<typeof AIParseSchema>;
export type ConversationRequestSchemaType = Static<typeof ConversationRequestSchema>;
